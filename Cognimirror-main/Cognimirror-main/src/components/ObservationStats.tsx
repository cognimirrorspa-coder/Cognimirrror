import React from 'react';
import { useObservationStats } from '../hooks/useObservationStats';
import { formatDuration, formatDate } from '../utils/formatters';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  CircularProgress, 
  Alert, 
  Divider, 
  Button,
  Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../context/AuthContext';

const gameNames: Record<string, string> = {
  'memory_mirror': 'Espejo de Memoria',
  'digit_span': 'Amplitud de Dígitos',
  'pattern_recognition': 'Reconocimiento de Patrones',
  'reaction_time': 'Tiempo de Reacción',
  'observer_dashboard': 'Panel de Observación'
};

type GameType = keyof typeof gameNames;

const StatCard: React.FC<{ title: string; value: string | number; subtext?: string }> = ({ 
  title, 
  value, 
  subtext 
}) => (
  <Card elevation={3} sx={{ height: '100%' }}>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" component="div">
        {value}
      </Typography>
      {subtext && (
        <Typography variant="body2" color="text.secondary">
          {subtext}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export const ObservationStats: React.FC = () => {
  const { selectedPatient } = useAuth();
  const { 
    totalSessions, 
    totalDuration, 
    averageDuration, 
    sessionsByGame, 
    lastSessions, 
    loading, 
    error,
    refresh 
  } = useObservationStats(selectedPatient?.id || null);

  const handleRefresh = () => {
    refresh();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error al cargar las estadísticas: {error}
      </Alert>
    );
  }

  if (!selectedPatient) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Selecciona un paciente para ver sus estadísticas
      </Alert>
    );
  }

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Estadísticas de Observación
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Sesiones Totales" 
            value={totalSessions}
            subtext={`${sessionsByGame.length} juegos diferentes`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Tiempo Total" 
            value={formatDuration(totalDuration)}
            subtext={`${Math.round(totalDuration / 60000)} minutos`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Duración Promedio" 
            value={formatDuration(averageDuration)}
            subtext="por sesión"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sesiones por Juego
              </Typography>
              <Box mt={2}>
                {sessionsByGame.map(({ game, count, totalDuration }) => (
                  <Box key={game} mb={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>{gameNames[game] || game}</Typography>
                      <Typography>
                        {count} sesiones • {formatDuration(totalDuration)}
                      </Typography>
                    </Box>
                    <Box 
                      bgcolor="primary.main" 
                      height={8} 
                      width={`${(count / totalSessions) * 100}%`} 
                      borderRadius={4}
                      mt={0.5}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Últimas Sesiones
              </Typography>
              <Box mt={2}>
                {lastSessions.length > 0 ? (
                  lastSessions.map((session) => (
                    <Box key={session.sessionId} mb={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight="bold">
                          {gameNames[session.game as GameType] || session.game}
                        </Typography>
                        <Typography color="text.secondary">
                          {formatDate(session.startTime)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDuration(session.duration || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {session.metrics?.rounds?.length || 0} rondas
                        </Typography>
                      </Box>
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary" fontStyle="italic">
                    No hay sesiones recientes
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
