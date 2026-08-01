//AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Patient, GameMode } from '../types';
import { mockInstitutions, mockTherapists, mockPatients } from '../data/mockData';
import { auth, initializeAnonymousAuth } from '../services/firebaseAuth';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  selectedPatient: Patient | null;
  gameMode: GameMode;
  login: (email: string, password: string) => boolean;
  loginByUsername: (username: string) => Promise<User | null>;
  logout: () => void;
  register: (userData: Partial<User>) => string | null;
  registerPatient: (patientData: Partial<Patient>) => string | null;
  selectPatient: (patientId: string) => void;
  switchGameMode: (mode: GameMode, parentPassword?: string) => boolean;
  addTherapistToInstitution: (therapistId: string, institutionId: string) => boolean;
  getPatientsByTherapist: (therapistId: string) => Patient[];
  getTherapistsByInstitution: (institutionId: string) => User[];
  getAllPatients: () => Patient[];
  quickTry: (name: string, age: number) => string;
  setUserWithFirestoreId: (firestoreId: string, name: string, age: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('cognimirror_users');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        // Merge mock users with saved users to ensure test accounts always exist
        const mockIds = new Set([...mockInstitutions, ...mockTherapists, ...mockPatients].map(u => u.id));
        const uniqueSaved = parsed.filter((u: User) => !mockIds.has(u.id));
        return [...mockInstitutions, ...mockTherapists, ...mockPatients, ...uniqueSaved];
      } catch (e) {
        console.error('Error parsing saved users:', e);
      }
    }
    return [
      ...mockInstitutions,
      ...mockTherapists,
      ...mockPatients,
    ];
  });

  // Persist users to localStorage
  useEffect(() => {
    localStorage.setItem('cognimirror_users', JSON.stringify(allUsers));
  }, [allUsers]);

  // Initialize Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAnonymousAuth();
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };
    initAuth();
  }, []);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('juego');

  const login = (email: string, password: string): boolean => {
    const user = allUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      setCurrentUser(user);

      if (user.type === 'paciente') {
        setSelectedPatient(user as Patient);
        setGameMode('juego');
      }

      return true;
    }
    return false;
  };

  const loginByUsername = async (username: string): Promise<User | null> => {
    // 1. Check local state first
    const localUser = allUsers.find(
      (u) => u.name.toLowerCase() === username.trim().toLowerCase()
    );

    if (localUser) {
      setCurrentUser(localUser);
      if (localUser.type === 'paciente') {
        setSelectedPatient(localUser as Patient);
        setGameMode('juego');
      }
      return localUser;
    }

    // 2. Check Firestore
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../data/firebase');

      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('nombre', '==', username.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const userData = doc.data();

        const firestoreUser: Patient = {
          id: doc.id,
          name: userData.nombre,
          age: userData.edad,
          type: 'paciente',
          email: '',
          password: '',
          parentEmails: [],
          therapistId: '',
          institutionId: '',
          diagnosis: [],
          progress: 0,
          achievements: [],
          sessions: [],
          createdAt: userData.fecha_registro ? userData.fecha_registro.toDate() : new Date()
        };

        setAllUsers(prev => {
          if (prev.some(u => u.id === firestoreUser.id)) return prev;
          return [...prev, firestoreUser];
        });

        setCurrentUser(firestoreUser);
        setSelectedPatient(firestoreUser);
        setGameMode('juego');
        return firestoreUser;
      }
    } catch (error) {
      console.error("Error logging in by username from Firestore:", error);
    }

    return null;
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedPatient(null);
    setGameMode('juego');
  };

  const register = (userData: Partial<User>): string | null => {
    // Use Firebase UID if available, otherwise fallback to timestamp
    const firebaseUid = auth.currentUser?.uid;
    const newId = firebaseUid || `user-${Date.now()}`;

    const newUser: User = {
      id: newId,
      email: userData.email || '',
      password: userData.password || '',
      type: userData.type || 'terapeuta',
      name: userData.name || '',
      institutionId: userData.institutionId,
      createdAt: new Date(),
    };

    setAllUsers([...allUsers, newUser]);
    return newUser.id;
  };

  const registerPatient = (patientData: Partial<Patient>): string | null => {
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      email: patientData.email || '',
      password: patientData.password || '',
      type: 'paciente',
      name: patientData.name || '',
      parentEmails: patientData.parentEmails || [],
      therapistId: patientData.therapistId || currentUser?.id || '',
      institutionId: patientData.institutionId || currentUser?.institutionId,
      age: patientData.age,
      diagnosis: patientData.diagnosis || [],
      progress: 0,
      achievements: [],
      sessions: [],
      createdAt: new Date(),
    };

    setAllUsers([...allUsers, newPatient]);
    return newPatient.id;
  };

  const selectPatient = (patientId: string) => {
    const patient = allUsers.find(
      (u) => u.id === patientId && u.type === 'paciente'
    ) as Patient;

    if (patient) {
      setSelectedPatient(patient);
      setCurrentUser(patient);
      setGameMode('juego');
    }
  };

  const switchGameMode = (mode: GameMode, parentPassword?: string): boolean => {
    if (mode === 'observador') {
      if (parentPassword === '1234' || parentPassword === selectedPatient?.password) {
        setGameMode(mode);
        return true;
      }
      return false;
    }

    setGameMode(mode);
    return true;
  };

  const addTherapistToInstitution = (therapistId: string, institutionId: string): boolean => {
    setAllUsers(
      allUsers.map((user) => {
        if (user.id === therapistId && user.type === 'terapeuta') {
          return { ...user, institutionId };
        }
        return user;
      })
    );
    return true;
  };

  const getPatientsByTherapist = (therapistId: string): Patient[] => {
    return allUsers.filter(
      (u) => u.type === 'paciente' && (u as Patient).therapistId === therapistId
    ) as Patient[];
  };

  const getTherapistsByInstitution = (institutionId: string): User[] => {
    return allUsers.filter(
      (u) => u.type === 'terapeuta' && u.institutionId === institutionId
    );
  };

  const getAllPatients = (): Patient[] => {
    return allUsers.filter((u) => u.type === 'paciente') as Patient[];
  };

  // Crear paciente temporal para flujo "Pruébalo ahora"
  const quickTry = (name: string, age: number): string => {
    // 1. Buscar si ya existe un usuario con ese nombre (case insensitive)
    const existingUser = allUsers.find(
      u => u.type === 'paciente' && u.name.toLowerCase() === name.toLowerCase()
    ) as Patient | undefined;

    if (existingUser) {
      console.log(`🔄 [Auth] Usuario existente encontrado: ${existingUser.name} (${existingUser.id})`);
      setSelectedPatient(existingUser);
      setCurrentUser(existingUser);
      setGameMode('juego');
      return existingUser.id;
    }

    // 2. Si no existe, crear uno nuevo
    const firebaseUid = auth.currentUser?.uid;
    const newId = firebaseUid || `pat-${Date.now()}`;

    const newPatient: Patient = {
      id: newId,
      email: '',
      password: '',
      type: 'paciente',
      name,
      parentEmails: [],
      therapistId: currentUser?.id || '',
      institutionId: currentUser?.institutionId,
      age,
      diagnosis: [],
      progress: 0,
      achievements: [],
      sessions: [],
      createdAt: new Date(),
    };

    console.log(`✨ [Auth] Creando nuevo usuario temporal: ${newPatient.name} (${newPatient.id})`);
    setAllUsers([...allUsers, newPatient]);
    setSelectedPatient(newPatient);
    setCurrentUser(newPatient);
    setGameMode('juego');
    return newPatient.id;
  };

  const setUserWithFirestoreId = (firestoreId: string, name: string, age: number) => {
    // Crear o actualizar usuario con ID de Firestore
    const patient: Patient = {
      id: firestoreId, // Usar el ID de Firestore (ej: "004")
      email: '',
      password: '',
      type: 'paciente',
      name,
      parentEmails: [],
      therapistId: currentUser?.id || '',
      institutionId: currentUser?.institutionId,
      age,
      diagnosis: [],
      progress: 0,
      achievements: [],
      sessions: [],
      createdAt: new Date(),
    };

    console.log(`✅ [Auth] Usuario establecido con ID de Firestore: ${patient.name} (${patient.id})`);

    // Actualizar o agregar a la lista
    const existingIndex = allUsers.findIndex(u => u.id === firestoreId);
    if (existingIndex >= 0) {
      const updated = [...allUsers];
      updated[existingIndex] = patient;
      setAllUsers(updated);
    } else {
      setAllUsers([...allUsers, patient]);
    }

    setSelectedPatient(patient);
    setCurrentUser(patient);
    setGameMode('juego');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        selectedPatient,
        gameMode,
        login,
        loginByUsername,
        logout,
        register,
        registerPatient,
        selectPatient,
        switchGameMode,
        addTherapistToInstitution,
        getPatientsByTherapist,
        getTherapistsByInstitution,
        getAllPatients,
        quickTry,
        setUserWithFirestoreId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
