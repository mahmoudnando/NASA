using System.Text;
using System.Threading.RateLimiting;
using AstronautHealthMonitoring.Data;
using AstronautHealthMonitoring.DTOs.Auth;
using AstronautHealthMonitoring.Hubs;
using AstronautHealthMonitoring.Models.Entities;
using AstronautHealthMonitoring.Services.Implementations;
using AstronautHealthMonitoring.Services.Interfaces;
using FluentValidation;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddProblemDetails();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddHealthChecks()
    .AddCheck<DbHealthCheck>("Database");

var keepAliveSeconds = builder.Configuration.GetValue("Hubs:KeepAliveSeconds", 15);
var clientTimeoutSeconds = builder.Configuration.GetValue("Hubs:ClientTimeoutSeconds", 30);
builder.Services.AddSignalR(options =>
{
    options.KeepAliveInterval = TimeSpan.FromSeconds(keepAliveSeconds);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(clientTimeoutSeconds);
});
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Servers = new List<OpenApiServer>
        {
            new() { Url = "/" }
        };

        var securityScheme = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Enter your JWT token to authorize requests."
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes.Add("Bearer", securityScheme);

        var securityRequirement = new OpenApiSecurityRequirement
        {
            [new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            }] = Array.Empty<string>()
        };

        document.SecurityRequirements.Add(securityRequirement);

        return Task.CompletedTask;
    });
});

// Register Mapster configuration scanning this assembly and scoped IMapper
var typeAdapterConfig = new TypeAdapterConfig();
typeAdapterConfig.Scan(typeof(Program).Assembly);
builder.Services.AddSingleton(typeAdapterConfig);
builder.Services.AddScoped<IMapper, ServiceMapper>();

// Register FluentValidation validators from this assembly
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

// Register stateless vital sign status evaluation engine
builder.Services.AddSingleton<IVitalSignStatusEvaluator, VitalSignStatusEvaluator>();

// Register AppDbContext with PostgreSQL (Supabase)
// Connection string is read from "ConnectionStrings:DefaultConnection" via user-secrets or appsettings
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=astronaut_health_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 1. Configure ASP.NET Core Identity
var passwordOptions = builder.Configuration.GetSection("Identity:Password");
var lockoutOptions = builder.Configuration.GetSection("Identity:Lockout");

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password policies from configuration
    options.Password.RequireDigit = passwordOptions.GetValue("RequireDigit", true);
    options.Password.RequireLowercase = passwordOptions.GetValue("RequireLowercase", true);
    options.Password.RequireUppercase = passwordOptions.GetValue("RequireUppercase", true);
    options.Password.RequireNonAlphanumeric = passwordOptions.GetValue("RequireNonAlphanumeric", true);
    options.Password.RequiredLength = passwordOptions.GetValue("RequiredLength", 8);

    // Lockout policies from configuration
    options.Lockout.MaxFailedAccessAttempts = lockoutOptions.GetValue("MaxFailedAccessAttempts", 5);
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(lockoutOptions.GetValue("DefaultLockoutMinutes", 15));
    options.Lockout.AllowedForNewUsers = lockoutOptions.GetValue("AllowedForNewUsers", true);

    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// 2. Configure JWT Authentication & SignalR Query-String Handler
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtKey = "DevelopmentPlaceholder_SetViaUserSecrets_Min32BytesLong!";
    }
    else
    {
        throw new InvalidOperationException("JWT signing key is not configured. Set 'Jwt:Key' via environment variables or secrets.");
    }
}
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AstronautHealthMonitoring";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AstronautHealthMonitoringClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromSeconds(30)
    };

    // Authenticate SignalR connections where the token is delivered via query string under /hubs
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// 3. Configure Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.AstronautOnly, policy => policy.RequireRole(UserRoles.Astronaut));
    options.AddPolicy(AuthPolicies.MonitorOnly, policy => policy.RequireRole(UserRoles.Monitor));
    options.AddPolicy(AuthPolicies.Authenticated, policy => policy.RequireAuthenticatedUser());
});

// 4. Configure CORS from Configuration
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 5. Configure Rate Limiter for Login and Manual Alert Endpoints from Configuration
var rateLimitSection = builder.Configuration.GetSection("RateLimiting:Login");
var permitLimit = rateLimitSection.GetValue("PermitLimit", 5);
var windowMinutes = rateLimitSection.GetValue("WindowMinutes", 1.0);
var queueLimit = rateLimitSection.GetValue("QueueLimit", 0);

var alertRateLimitSection = builder.Configuration.GetSection("RateLimiting:ManualAlert");
var alertPermitLimit = alertRateLimitSection.GetValue("PermitLimit", 5);
var alertWindowMinutes = alertRateLimitSection.GetValue("WindowMinutes", 1.0);
var alertQueueLimit = alertRateLimitSection.GetValue("QueueLimit", 0);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("LoginLimiter", opt =>
    {
        opt.PermitLimit = permitLimit;
        opt.Window = TimeSpan.FromMinutes(windowMinutes);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = queueLimit;
    });
    options.AddFixedWindowLimiter("ManualAlertLimiter", opt =>
    {
        opt.PermitLimit = alertPermitLimit;
        opt.Window = TimeSpan.FromMinutes(alertWindowMinutes);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = alertQueueLimit;
    });
});

// 6. Register Identity, Auth, Context, and Clinical Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IIdentityDataSeeder, IdentityDataSeeder>();
builder.Services.AddScoped<IVitalSignService, VitalSignService>();
builder.Services.AddScoped<IHealthAlertService, HealthAlertService>();
builder.Services.AddScoped<IAlertNotifier, SignalRAlertNotifier>();
builder.Services.AddScoped<ISleepService, SleepService>();
builder.Services.AddScoped<IMoodService, MoodService>();
builder.Services.AddScoped<IAstronautService, AstronautService>();
builder.Services.AddScoped<IMissionService, MissionService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<ISymptomGuidanceService, SymptomGuidanceService>();
builder.Services.AddScoped<IChatNotifier, SignalRChatNotifier>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<ISyncService, SyncService>();

var app = builder.Build();

// 7. Startup Check: Log which configuration provider supplied the database connection string (host only)
if (app.Configuration is IConfigurationRoot configRoot)
{
    string? winningProvider = null;
    string? rawConnectionString = null;

    foreach (var provider in configRoot.Providers.Reverse())
    {
        if (provider.TryGet("ConnectionStrings:DefaultConnection", out var val) && !string.IsNullOrWhiteSpace(val))
        {
            winningProvider = provider.ToString();
            rawConnectionString = val;
            break;
        }
    }

    if (!string.IsNullOrWhiteSpace(rawConnectionString))
    {
        var host = "Unknown";
        try
        {
            var npgsqlBuilder = new Npgsql.NpgsqlConnectionStringBuilder(rawConnectionString);
            host = npgsqlBuilder.Host;
        }
        catch
        {
            var match = System.Text.RegularExpressions.Regex.Match(rawConnectionString, @"Host=([^;]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (match.Success) host = match.Groups[1].Value;
        }

        app.Logger.LogInformation("Database connection configured. Host: '{Host}', Resolved from configuration provider: '{Provider}'",
            host, winningProvider ?? "Unknown");
    }
    else
    {
        app.Logger.LogWarning("No connection string found for 'ConnectionStrings:DefaultConnection'.");
    }
}

// Configure HTTP request pipeline
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment() || app.Configuration.GetValue("OpenApi:Enabled", true))
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Astronaut Health Monitoring API v1");
        options.RoutePrefix = "swagger";
    });
}

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("DefaultCorsPolicy");
app.UseRateLimiter();

app.MapHealthChecks("/health").AllowAnonymous();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<AlertsHub>("/hubs/alerts");
app.MapHub<ChatHub>("/hubs/chat");

// 8. Run EF Core Migrations & Identity Demo User Seeding (Development environment or when SeedData:Enabled / Database:AutoMigrate is true)
var autoMigrate = app.Environment.IsDevelopment() || app.Configuration.GetValue("Database:AutoMigrate", false);
var seedingEnabled = app.Environment.IsDevelopment() || app.Configuration.GetValue("SeedData:Enabled", false);
if (autoMigrate || seedingEnabled)
{
    try
    {
        using var scope = app.Services.CreateScope();
        if (autoMigrate)
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await dbContext.Database.MigrateAsync();
            app.Logger.LogInformation("Database migrations applied successfully.");
        }

        if (seedingEnabled)
        {
            var seeder = scope.ServiceProvider.GetRequiredService<IIdentityDataSeeder>();
            await seeder.SeedAsync();
        }
    }
    catch (InvalidOperationException)
    {
        // Re-throw fail-fast configuration error so startup halts immediately listing missing key names
        throw;
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning("Skipping database migration or identity demo user seeding at startup: {Message}", ex.Message);
    }
}

app.Run();
