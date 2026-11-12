import {
  VitalSignReading,
  HealthAlert,
  SleepRecord,
  MoodEntry,
  Recommendation,
  RecommendationStatus,
  ChatMessage,
  CreateVitalReadingPayload,
} from '../types/telemetry';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

class ApiService {
  private accessToken: string | null = localStorage.getItem('nasa_access_token');
  private refreshToken: string | null = localStorage.getItem('nasa_refresh_token');

  public setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('nasa_access_token', access);
    localStorage.setItem('nasa_refresh_token', refresh);
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('nasa_access_token');
    localStorage.removeItem('nasa_refresh_token');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshTokens();
      if (refreshed && this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const data = await res.json();
      const nextAccessToken = data.token || data.accessToken;
      if (nextAccessToken && data.refreshToken) {
        this.setTokens(nextAccessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // 1. AuthController (/api/auth/*)
  public async login(username: string, password: string): Promise<any> {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const nextAccessToken = data.token || data.accessToken;
    if (nextAccessToken && data.refreshToken) {
      this.setTokens(nextAccessToken, data.refreshToken);
    }
    return data;
  }

  public async logout(): Promise<any> {
    const res = await this.request<any>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    }).catch(() => ({}));
    this.clearTokens();
    return res;
  }

  public async getCurrentUser(): Promise<any> {
    return this.request<any>('/auth/me');
  }

  // 2. DashboardController (/api/dashboard/*)
  public async getDashboardMe(): Promise<any> {
    return this.request<any>('/dashboard/me');
  }

  public async getMonitorDashboard(): Promise<any> {
    return this.request<any>('/dashboard/monitor');
  }

  public async getAstronautSnapshot(id: number): Promise<any> {
    return this.request<any>(`/dashboard/astronauts/${id}`);
  }

  // 3. VitalSignsController (/api/vitalsigns/*)
  public async getVitalById(id: number): Promise<VitalSignReading> {
    return this.request<VitalSignReading>(`/vitalsigns/${id}`);
  }

  public async getLatestVitals(astronautId?: number): Promise<VitalSignReading[]> {
    const query = astronautId ? `?astronautId=${astronautId}` : '';
    return this.request<VitalSignReading[]>(`/vitalsigns/latest${query}`);
  }

  public async getVitalsHistory(
    pageNumber = 1,
    pageSize = 25,
    astronautId?: number,
    fromUtc?: string,
    toUtc?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    if (astronautId) params.set('astronautId', String(astronautId));
    if (fromUtc) params.set('fromUtc', fromUtc);
    if (toUtc) params.set('toUtc', toUtc);
    return this.request<any>(`/vitalsigns/history?${params.toString()}`);
  }

  public async getVitalTypes(): Promise<any[]> {
    return this.request<any[]>('/vitalsigns/types');
  }

  public async recordVital(payload: CreateVitalReadingPayload): Promise<VitalSignReading> {
    const typeMap: Record<string, number> = {
      HR: 1,
      BP: 2,
      SPO2: 3,
      TEMP: 4,
      GLUCOSE: 5,
      RESP: 6,
    };
    return this.request<VitalSignReading>('/vitalsigns', {
      method: 'POST',
      body: JSON.stringify({
        clientGeneratedId: crypto.randomUUID(),
        vitalSignTypeId: typeMap[payload.vitalSignTypeCode] || 1,
        value: payload.value,
        secondaryValue: payload.secondaryValue,
        bodyPosition: payload.bodyPosition || 'MicrogravityFloating',
        activityContext: payload.activityContext || 'Resting',
        mealContext: payload.mealContext,
        sensorLocation: payload.sensorLocation || 'Thoracic Biometric Vest',
        measurementMethod: 'Automated Telemetry Sensor',
        notes: payload.notes,
        recordedAt: new Date().toISOString(),
      }),
    });
  }

  // 4. HealthAlertsController (/api/alerts/*)
  public async getAlerts(status?: string, severity?: string, astronautId?: number): Promise<any> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (severity) params.set('severity', severity);
    if (astronautId) params.set('astronautId', String(astronautId));
    const qs = params.toString();
    return this.request<any>(`/alerts${qs ? `?${qs}` : ''}`);
  }

  public async getAlertById(id: number): Promise<HealthAlert> {
    return this.request<HealthAlert>(`/alerts/${id}`);
  }

  public async triggerManualAlert(
    title: string,
    message: string,
    severity: 'MedicalAttention' | 'Emergency',
    astronautId = 1
  ): Promise<HealthAlert> {
    return this.request<HealthAlert>('/alerts/manual', {
      method: 'POST',
      body: JSON.stringify({ astronautId, title, message, severity }),
    });
  }

  public async acknowledgeAlert(
    id: number,
    actionTaken = 'Reviewed by Flight Surgeon'
  ): Promise<HealthAlert> {
    return this.request<HealthAlert>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ actionTaken }),
    });
  }

  public async resolveAlert(id: number, resolutionNotes: string): Promise<HealthAlert> {
    return this.request<HealthAlert>(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes }),
    });
  }

  // 5. SleepController (/api/sleep/*)
  public async getSleepById(id: number): Promise<SleepRecord> {
    return this.request<SleepRecord>(`/sleep/${id}`);
  }

  public async getLatestSleep(astronautId?: number): Promise<SleepRecord> {
    const qs = astronautId ? `?astronautId=${astronautId}` : '';
    return this.request<SleepRecord>(`/sleep/latest${qs}`);
  }

  public async getSleepHistory(pageNumber = 1, pageSize = 20, astronautId?: number): Promise<any> {
    const params = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    if (astronautId) params.set('astronautId', String(astronautId));
    return this.request<any>(`/sleep/history?${params.toString()}`);
  }

  public async recordSleep(payload: Partial<SleepRecord>): Promise<SleepRecord> {
    return this.request<SleepRecord>('/sleep', {
      method: 'POST',
      body: JSON.stringify({
        clientGeneratedId: crypto.randomUUID(),
        recordedAt: new Date().toISOString(),
        ...payload,
      }),
    });
  }

  // 6. MoodController (/api/mood/*)
  public async getMoodById(id: number): Promise<MoodEntry> {
    return this.request<MoodEntry>(`/mood/${id}`);
  }

  public async getLatestMood(astronautId?: number): Promise<MoodEntry> {
    const qs = astronautId ? `?astronautId=${astronautId}` : '';
    return this.request<MoodEntry>(`/mood/latest${qs}`);
  }

  public async getMoodHistory(pageNumber = 1, pageSize = 20, astronautId?: number): Promise<any> {
    const params = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    if (astronautId) params.set('astronautId', String(astronautId));
    return this.request<any>(`/mood/history?${params.toString()}`);
  }

  public async recordMood(payload: Partial<MoodEntry>): Promise<MoodEntry> {
    return this.request<MoodEntry>('/mood', {
      method: 'POST',
      body: JSON.stringify({
        clientGeneratedId: crypto.randomUUID(),
        recordedAt: new Date().toISOString(),
        ...payload,
      }),
    });
  }

  // 7. RecommendationsController (/api/recommendations/*)
  public async getRecommendations(astronautId?: number, pendingOnly = false): Promise<any> {
    const params = new URLSearchParams({ pendingOnly: String(pendingOnly) });
    if (astronautId) params.set('astronautId', String(astronautId));
    return this.request<any>(`/recommendations?${params.toString()}`);
  }

  public async getRecommendationById(id: number): Promise<Recommendation> {
    return this.request<Recommendation>(`/recommendations/${id}`);
  }

  public async updateRecommendationStatus(
    id: number,
    status: RecommendationStatus
  ): Promise<Recommendation> {
    return this.request<Recommendation>(`/recommendations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  public async createRecommendation(payload: any): Promise<Recommendation> {
    return this.request<Recommendation>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 8. SymptomGuidanceController (/api/symptoms/*)
  public async getSymptoms(): Promise<any[]> {
    return this.request<any[]>('/symptoms');
  }

  public async getSpaceConditions(search?: string): Promise<any[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/symptoms/guidance${qs}`);
  }

  public async assessSymptoms(astronautId: number, symptomCodes: string[]): Promise<any> {
    return this.request<any>('/symptoms/assess', {
      method: 'POST',
      body: JSON.stringify({ astronautId, symptomCodes }),
    });
  }

  // 9. ChatController (/api/chat/*)
  public async getChatMessages(astronautId?: number): Promise<any> {
    const query = astronautId ? `?astronautId=${astronautId}` : '';
    return this.request<any>(`/chat/messages${query}`);
  }

  public async sendChatMessage(content: string, astronautId?: number): Promise<ChatMessage> {
    const nowIso = new Date().toISOString();
    return this.request<ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        clientGeneratedId: crypto.randomUUID(),
        astronautId,
        content,
        recordedAt: nowIso,
      }),
    });
  }

  public async markChatMessageRead(id: number): Promise<ChatMessage> {
    return this.request<ChatMessage>(`/chat/messages/${id}/read`, {
      method: 'POST',
    });
  }

  public async getUnreadChatCount(astronautId?: number): Promise<any> {
    const query = astronautId ? `?astronautId=${astronautId}` : '';
    return this.request<any>(`/chat/unread-count${query}`);
  }

  // 10. AstronautsController (/api/astronauts/*)
  public async getAstronauts(missionId?: number): Promise<any> {
    const qs = missionId ? `?missionId=${missionId}` : '';
    return this.request<any>(`/astronauts${qs}`);
  }

  public async getAstronautMe(): Promise<any> {
    return this.request<any>('/astronauts/me');
  }

  public async getAstronautById(id: number): Promise<any> {
    return this.request<any>(`/astronauts/${id}`);
  }

  public async createAstronaut(payload: any): Promise<any> {
    return this.request<any>('/astronauts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateAstronaut(id: number, payload: any): Promise<any> {
    return this.request<any>(`/astronauts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deactivateAstronaut(id: number): Promise<any> {
    return this.request<any>(`/astronauts/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // 11. MissionsController (/api/missions/*)
  public async getMissions(): Promise<any[]> {
    return this.request<any[]>('/missions');
  }

  public async getMissionById(id: number): Promise<any> {
    return this.request<any>(`/missions/${id}`);
  }

  public async createMission(payload: any): Promise<any> {
    return this.request<any>('/missions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateMission(id: number, payload: any): Promise<any> {
    return this.request<any>(`/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteMission(id: number): Promise<any> {
    return this.request<any>(`/missions/${id}`, {
      method: 'DELETE',
    });
  }

  public async assignAstronautToMission(missionId: number, astronautId: number): Promise<any> {
    return this.request<any>(`/missions/${missionId}/astronauts/${astronautId}`, {
      method: 'POST',
    });
  }

  public async unassignAstronautFromMission(missionId: number, astronautId: number): Promise<any> {
    return this.request<any>(`/missions/${missionId}/astronauts/${astronautId}`, {
      method: 'DELETE',
    });
  }

  // 12. SyncController (/api/sync)
  public async syncOfflineBatch(batch: any): Promise<any> {
    return this.request<any>('/sync', {
      method: 'POST',
      body: JSON.stringify(batch),
    });
  }
}

export const api = new ApiService();
