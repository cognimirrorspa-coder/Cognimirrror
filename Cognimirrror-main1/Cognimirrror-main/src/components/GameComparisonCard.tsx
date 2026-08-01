import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Divider, Tooltip } from '@mui/material';
import { GameStats } from '../hooks/useObservationStats';

interface GameComparisonCardProps {
  games: GameStats[];
  onGameSelect?: (game: string) => void;
}

const getGameIcon = (game: string) => {
  const icons: Record<string, string> = {
    'memory_mirror': '🧠',
    'digit_span': '🔢',
    'pattern_recognition': '🔍',
    'reaction_time': '⚡',
    'observer_dashboard': '📊',
  };
  return icons[game] || '🎮';
};

const formatPercentage = (value: number) => `${Math.round(value)}%`;

const GameComparisonCard: React.FC<GameComparisonCardProps> = ({ games, onGameSelect }) => {
  if (games.length === 0) {
    return (
      <Card elevation={3} sx={{ height: '100%' }}>
        <CardContent>
          <Typography color="textSecondary">No hay datos de juegos para comparar</Typography>
        </CardContent>
      </Card>
    );
  }

  // Encontrar máximos para normalizar las barras
  const maxSessions = Math.max(...games.map(g => g.count), 1);
  const maxSuccessRate = Math.max(...games.map(g => g.successRate || 0), 1);
  const maxDuration = Math.max(...games.map(g => g.avgDuration), 1);

  return (
    <Card elevation={3} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Comparación de Juegos
        </Typography>
        <Box mt={2}>
          {games.map((game) => (
            <Box key={game.game} mb={3}>
              <Box 
                display="flex" 
                alignItems="center" 
                mb={1}
                onClick={() => onGameSelect?.(game.game)}
                sx={{ cursor: onGameSelect ? 'pointer' : 'default', '&:hover': { opacity: onGameSelect ? 0.8 : 1 } }}
              >
                <Typography variant="h5" mr={1}>
                  {getGameIcon(game.game)}
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {game.game.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
              </Box>
              
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="textSecondary">Sesiones:</Typography>
                  <Typography variant="body2">{game.count}</Typography>
                </Box>
                <Box 
                  bgcolor="primary.light" 
                  height={8} 
                  width={`${(game.count / maxSessions) * 100}%`} 
                  borderRadius={4}
                  mb={1}
                />
              </Box>
              
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Tooltip title="Promedio de aciertos">
                    <Typography variant="body2" color="textSecondary">
                      Tasa de éxito:
                    </Typography>
                  </Tooltip>
                  <Typography variant="body2">
                    {formatPercentage(game.successRate || 0)}
                  </Typography>
                </Box>
                <Box 
                  bgcolor="success.light" 
                  height={8} 
                  width={`${((game.successRate || 0) / maxSuccessRate) * 100}%`} 
                  borderRadius={4}
                  mb={1}
                />
              </Box>
              
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Tooltip title="Duración promedio por sesión">
                    <Typography variant="body2" color="textSecondary">
                      Duración promedio:
                    </Typography>
                  </Tooltip>
                  <Typography variant="body2">
                    {Math.round(game.avgDuration / 1000)}s
                  </Typography>
                </Box>
                <Box 
                  bgcolor="info.light" 
                  height={8} 
                  width={`${(game.avgDuration / maxDuration) * 100}%`} 
                  borderRadius={4}
                  mb={1}
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Tooltip title="Rondas por sesión">
                  <Typography variant="body2" color="textSecondary">
                    {Math.round(game.avgRoundsPerSession)} rondas/sesión
                  </Typography>
                </Tooltip>
                <Tooltip title="Tiempo por ronda">
                  <Typography variant="body2" color="textSecondary">
                    {Math.round(game.avgTimePerRound || 0)}s/ronda
                  </Typography>
                </Tooltip>
              </Box>
              
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default GameComparisonCard;
