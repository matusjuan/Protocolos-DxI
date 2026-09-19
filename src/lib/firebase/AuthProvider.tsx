"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { Rol } from "@/types/database.types";

interface AuthState {
  cargando: boolean;
  user: User | null;
  rol: Rol | null;
  nombre: string | null;
}

const AuthContext = createContext<AuthState>({
  cargando: true,
  user: null,
  rol: null,
  nombre: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    cargando: true,
    user: null,
    rol: null,
    nombre: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ cargando: false, user: null, rol: null, nombre: null });
        return;
      }

      try {
        const snap = await getDoc(doc(db, "perfiles", user.uid));
        const data = snap.data();
        setState({
          cargando: false,
          user,
          rol: (data?.rol as Rol) ?? null,
          nombre: data?.nombre ?? null,
        });
      } catch (err) {
        console.error("No se pudo leer el perfil del usuario:", err);
        setState({ cargando: false, user, rol: null, nombre: null });
      }
    });

    return () => unsub();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
