import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const HARDCODED_USERNAME = 'ashasharma';
const HARDCODED_PASSWORD = 'asha123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('maitri_auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setIsAuthenticated(authData.isAuthenticated);
      setUsername(authData.username);
    }
  }, []);

  const login = (inputUsername: string, inputPassword: string): boolean => {
    if (inputUsername === HARDCODED_USERNAME && inputPassword === HARDCODED_PASSWORD) {
      setIsAuthenticated(true);
      setUsername(inputUsername);
      localStorage.setItem('maitri_auth', JSON.stringify({ 
        isAuthenticated: true, 
        username: inputUsername 
      }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('maitri_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
