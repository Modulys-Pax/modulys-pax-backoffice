'use client';

import { useState } from 'react';
import { Mail, Lock, AlertCircle, Shield, Zap, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { authService } from '@/lib/api';
import styles from './page.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@grayskull.com.br');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      login(response.user, response.accessToken);
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Side - Branding */}
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.logo}>G</div>
          <h1>Grayskull</h1>
          <p>Painel Administrativo</p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Shield size={20} />
            </div>
            <div className={styles.featureText}>
              <strong>Segurança Total</strong>
              <span>Dados criptografados e protegidos</span>
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Zap size={20} />
            </div>
            <div className={styles.featureText}>
              <strong>Alta Performance</strong>
              <span>Sistema rápido e responsivo</span>
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Users size={20} />
            </div>
            <div className={styles.featureText}>
              <strong>Multi-tenant</strong>
              <span>Gerencie múltiplas empresas</span>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className={styles.illustration}>
          <div className={styles.circle1} />
          <div className={styles.circle2} />
          <div className={styles.circle3} />
          <div className={styles.circle4} />
          <div className={styles.circle5} />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className={styles.right}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h2>Bem-vindo de volta!</h2>
            <p>Faça login para acessar o painel administrativo e gerenciar seus clientes.</p>
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className={styles.options}>
              <label className={styles.checkbox}>
                <input type="checkbox" defaultChecked />
                <span>Lembrar de mim</span>
              </label>
              <a href="#" className={styles.forgot}>Esqueceu a senha?</a>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Grayskull ERP &copy; 2026. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
