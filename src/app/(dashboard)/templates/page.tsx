'use client';

import { useState, useEffect } from 'react';
import { FileCode2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { templatesService } from '@/lib/api';
import styles from './page.module.css';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await templatesService.findAll();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Templates" subtitle="Templates para geração de projetos (frontend)" />
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <h2>Templates</h2>
            <p>Use um template para gerar o projeto do cliente na tela de Clientes</p>
          </div>
        </div>
        <div className={styles.templatesGrid}>
          {loading ? (
            <p>Carregando...</p>
          ) : templates.length === 0 ? (
            <div className={styles.emptyState}>
              <FileCode2 size={56} />
              <h3>Nenhum template cadastrado</h3>
              <p>Cadastre templates no banco admin (seed) para exibir aqui.</p>
            </div>
          ) : (
            templates.map((tpl, index) => (
              <div
                key={tpl.id}
                className={styles.templateCard}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={styles.templateHeader}>
                  <div className={styles.templateIcon}>
                    <FileCode2 size={24} />
                  </div>
                  <div>
                    <h3>{tpl.name}</h3>
                    <span className={styles.templateCode}>{tpl.code}</span>
                  </div>
                </div>
                {tpl.description && <p>{tpl.description}</p>}
                {tpl.sourcePath && (
                  <div className={styles.templatePath}>📁 {tpl.sourcePath}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
