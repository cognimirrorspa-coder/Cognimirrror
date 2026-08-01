// firebaseAuth.ts - Sistema de autenticación anónima automática
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../data/firebase';

// Inicializar Auth
export const auth = getAuth(app);

/**
 * Inicializar autenticación anónima automática
 * Se ejecuta al cargar la app
 */
export async function initializeAnonymousAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    // Verificar si ya hay un usuario autenticado
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('✅ [Auth] Usuario ya autenticado:', user.uid);
        resolve(user);
      } else {
        // No hay usuario, crear uno anónimo
        try {
          const userCredential = await signInAnonymously(auth);
          console.log('✅ [Auth] Usuario anónimo creado:', userCredential.user.uid);
          resolve(userCredential.user);
        } catch (error) {
          console.error('❌ [Auth] Error creando usuario anónimo:', error);
          resolve(null);
        }
      }
    });
  });
}

/**
 * Obtener el usuario actual
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Obtener el UID del usuario actual
 */
export function getCurrentUserId(): string {
  return auth.currentUser?.uid || 'demo-user';
}
