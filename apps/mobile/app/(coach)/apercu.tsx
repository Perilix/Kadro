import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Alert, AthleteListItem, CoachDashboard, Page } from '@kadro/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { radius, useTheme } from '../../lib/theme';
import { Card } from '../../lib/ui';
import { Icon } from '../../lib/icon';

const ALERT_LABELS: Record<string, string> = {
  form_red_streak: 'Fatigue signalée plusieurs jours de suite',
  missed_session: 'Séance manquée',
  no_activity: 'Aucune activité récente',
  no_checkin: 'Sans check-in depuis plusieurs jours',
  sleep_low: 'Sommeil insuffisant',
  resting_hr_up: 'FC repos élevée',
  hrv_drop: 'Chute de VFC',
  acr_high: 'Charge aiguë élevée',
  race_soon: 'Compétition imminente',
  no_watch: 'Pas de montre reliée',
  watch_disconnected: 'Montre déconnectée',
  watch_push_failed: 'Envoi montre échoué',
};

export default function CoachApercuScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<CoachDashboard | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [d, a, roster] = await Promise.all([
          api.get<CoachDashboard>('/team/dashboard').catch(() => null),
          api.get<Page<Alert>>('/alerts').catch(() => null),
          api.get<Page<AthleteListItem>>('/athletes?limit=100').catch(() => null),
        ]);
        setDashboard(d);
        setAlerts(a?.items ?? []);
        setNames(new Map((roster?.items ?? []).map((x) => [x.id, `${x.firstName} ${x.lastName}`])));
      })();
    }, []),
  );

  const dateLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const sevColor = (a: Alert) => (a.severity === 'critical' ? t.bad : a.severity === 'warn' ? t.warn : t.ink3);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink3, fontSize: 13, textTransform: 'capitalize' }}>{dateLabel}</Text>
          <Text style={{ color: t.ink, fontSize: 26, fontWeight: '600', letterSpacing: -0.5, marginTop: 2 }}>
            Bonjour {user?.firstName}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="bell" size={20} />
        </Pressable>
      </View>

      {dashboard ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, padding: 14 }}>
            <Text style={{ color: t.ink3, fontSize: 12 }}>Séances cette semaine</Text>
            <Text style={{ color: t.ink, fontSize: 22, fontWeight: '600', marginTop: 2 }}>
              {dashboard.kpis.sessionsDone} / {dashboard.kpis.sessionsPlanned}
            </Text>
          </Card>
          <Card style={{ flex: 1, padding: 14 }}>
            <Text style={{ color: t.ink3, fontSize: 12 }}>Alertes forme</Text>
            <Text style={{ color: dashboard.kpis.openAlerts > 0 ? t.bad : t.ink, fontSize: 22, fontWeight: '600', marginTop: 2 }}>
              {dashboard.kpis.openAlerts}
            </Text>
          </Card>
        </View>
      ) : null}

      {alerts.length > 0 ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
            <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>À traiter</Text>
            <Text style={{ color: t.ink3, fontSize: 12.5 }}>{alerts.length}</Text>
          </View>
          {alerts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push({ pathname: '/athlete/[id]', params: { id: a.athleteId } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: t.line }}
            >
              <View style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: sevColor(a) }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: t.ink, fontSize: 14, fontWeight: '600' }}>{names.get(a.athleteId) ?? ''}</Text>
                <Text style={{ color: t.ink2, fontSize: 12.5 }} numberOfLines={1}>
                  {ALERT_LABELS[a.kind] ?? a.kind}
                </Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {dashboard ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
            <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>Aujourd'hui</Text>
            <Text style={{ color: t.ink3, fontSize: 12.5 }}>
              {dashboard.today.filter((x) => x.session).length} séances
            </Text>
          </View>
          {dashboard.today.map((item) => (
            <Pressable
              key={item.athleteId}
              onPress={() => router.push({ pathname: '/athlete/[id]', params: { id: item.athleteId } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: t.line }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: '500' }}>{item.firstName} {item.lastName}</Text>
                <Text style={{ color: t.ink2, fontSize: 12 }} numberOfLines={1}>{item.session?.name ?? 'Repos'}</Text>
              </View>
              {item.session?.status === 'completed' ? (
                <View style={{ height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: t.goodSoft, justifyContent: 'center' }}>
                  <Text style={{ color: t.good, fontSize: 12, fontWeight: '500' }}>Réalisée</Text>
                </View>
              ) : item.session ? (
                <View style={{ height: 26, paddingHorizontal: 10, backgroundColor: t.neutralSoft, justifyContent: 'center', borderRadius: 999 }}>
                  <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500' }}>Prévue</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}
