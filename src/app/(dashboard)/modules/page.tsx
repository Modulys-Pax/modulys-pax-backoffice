'use client';

import { useState, useEffect } from 'react';
import { Package, RefreshCw, Check, X, Plus, Pencil, Trash2, Star, GitBranch } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button, Input, Modal, ModalBody, ModalFooter } from '@/components/ui';
import { modulesService } from '@/lib/api';
import styles from './page.module.css';

type ModalMode = 'create' | 'edit';

export default function ModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    version: '1.0.0',
    repositoryUrl: '',
    modulePath: '',      // Nome da pasta do projeto (ex: modulys-pax-baileys-service)
    migrationsPath: '',  // Subpasta das migrations (padrão: prisma)
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await modulesService.findAll();
      setModules(data);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm('Isso irá criar/atualizar os módulos padrão. Continuar?')) return;
    
    setSeeding(true);
    try {
      await modulesService.seed();
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar módulos');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedModule(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      version: '1.0.0',
      repositoryUrl: '',
      modulePath: '',
      migrationsPath: 'prisma', // Valor padrão
    });
    setShowModal(true);
  };

  const openEditModal = (mod: any) => {
    setModalMode('edit');
    setSelectedModule(mod);
    setFormData({
      code: mod.code,
      name: mod.name,
      description: mod.description || '',
      version: mod.version || '1.0.0',
      repositoryUrl: mod.repositoryUrl || '',
      modulePath: mod.modulePath || '',
      migrationsPath: mod.migrationsPath || 'prisma',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        await modulesService.create({
          ...formData,
          isCustom: true,
        });
      } else {
        await modulesService.update(selectedModule.id, {
          name: formData.name,
          description: formData.description,
          version: formData.version,
          repositoryUrl: formData.repositoryUrl,
          modulePath: formData.modulePath,
          migrationsPath: formData.migrationsPath,
        });
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar módulo');
    }
  };

  const handleDelete = async (mod: any) => {
    if (!confirm(`Tem certeza que deseja excluir o módulo "${mod.name}"?`)) return;

    try {
      await modulesService.delete(mod.id);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir módulo');
    }
  };

  const standardModules = modules.filter(m => !m.isCustom);
  const customModules = modules.filter(m => m.isCustom);

  const renderModuleCard = (mod: any, index: number) => (
    <div 
      key={mod.id} 
      className={`${styles.moduleCard} ${mod.isCore ? styles.core : ''} ${mod.isCustom ? styles.custom : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={styles.moduleHeader}>
        <div className={`${styles.moduleIcon} ${mod.isCore ? styles.coreIcon : ''} ${mod.isCustom ? styles.customIcon : ''}`}>
          {mod.isCustom ? <Star size={26} /> : <Package size={26} />}
        </div>
        <div className={styles.cardActions}>
          {mod.isCustom && (
            <>
              <button 
                className={styles.cardActionBtn} 
                onClick={() => openEditModal(mod)}
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button 
                className={`${styles.cardActionBtn} ${styles.deleteBtn}`} 
                onClick={() => handleDelete(mod)}
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          {!mod.isCustom && !mod.isCore && (
            <button 
              className={styles.cardActionBtn} 
              onClick={() => openEditModal(mod)}
              title="Editar"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>
      </div>
      <div className={styles.moduleBody}>
        <div className={styles.moduleTitle}>
          <h3>{mod.name}</h3>
          {mod.isCore && <span className={styles.coreTag}>Obrigatório</span>}
          {mod.isCustom && <span className={styles.customTag}>Personalizado</span>}
        </div>
        <span className={styles.moduleCode}>{mod.code}</span>
        <p className={styles.moduleDescription}>{mod.description || 'Sem descrição disponível'}</p>
        
        {mod.isCustom && mod.modulePath && (
          <div className={styles.repoInfo}>
            <Package size={14} />
            <span>{mod.modulePath}/</span>
            <span className={styles.migrationsPath}>{mod.migrationsPath || 'prisma'}</span>
          </div>
        )}
        {mod.isCustom && mod.repositoryUrl && (
          <a href={mod.repositoryUrl} target="_blank" rel="noopener noreferrer" className={styles.repoLink}>
            <GitBranch size={14} />
            <span>Ver no GitHub</span>
          </a>
        )}
      </div>
      <div className={styles.moduleFooter}>
        {!mod.isCustom && (
          <div className={styles.moduleStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{mod._count?.tenants || 0}</span>
              <span className={styles.statLabel}>Clientes</span>
            </div>
          </div>
        )}
        <div className={styles.moduleStatus}>
          {mod.isActive ? (
            <span className={styles.statusActive}>
              <Check size={14} /> Ativo
            </span>
          ) : (
            <span className={styles.statusInactive}>
              <X size={14} /> Inativo
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header title="Módulos" subtitle="Módulos disponíveis no sistema" />
      
      <div className={styles.content}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <h2>Módulos</h2>
            <p>
              {standardModules.length} padrão, {customModules.length} personalizado{customModules.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className={styles.pageActions}>
            <Button 
              variant="outline" 
              onClick={handleSeed} 
              disabled={seeding}
              icon={<RefreshCw size={18} className={seeding ? styles.spinning : ''} />}
            >
              {seeding ? 'Criando...' : 'Recriar Padrões'}
            </Button>
            <Button onClick={openCreateModal} icon={<Plus size={18} />}>
              Novo Módulo Personalizado
            </Button>
          </div>
        </div>

        {/* Standard Modules */}
        <div className={styles.sectionTitle}>
          <Package size={20} />
          <h3>Módulos Padrão</h3>
          <span className={styles.sectionCount}>{standardModules.length}</span>
        </div>
        
        <div className={styles.modulesGrid}>
          {standardModules.length === 0 ? (
            <div className={styles.emptyState}>
              <Package size={56} />
              <h3>Nenhum módulo padrão</h3>
              <p>Clique em "Recriar Padrões" para criar os módulos do sistema</p>
              <Button 
                onClick={handleSeed} 
                disabled={seeding}
                icon={<RefreshCw size={18} />}
              >
                Criar Módulos
              </Button>
            </div>
          ) : (
            standardModules.map((mod, index) => renderModuleCard(mod, index))
          )}
        </div>

        {/* Custom Modules */}
        <div className={styles.sectionTitle}>
          <Star size={20} />
          <h3>Módulos Personalizados</h3>
          <span className={styles.sectionCount}>{customModules.length}</span>
        </div>
        
        <div className={styles.modulesGrid}>
          {customModules.length === 0 ? (
            <div className={styles.emptyStateSmall}>
              <Star size={40} />
              <p>Nenhum módulo personalizado cadastrado</p>
              <Button variant="outline" size="sm" onClick={openCreateModal} icon={<Plus size={16} />}>
                Criar Primeiro
              </Button>
            </div>
          ) : (
            customModules.map((mod, index) => renderModuleCard(mod, index))
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={modalMode === 'create' ? 'Novo Módulo Personalizado' : 'Editar Módulo'}
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className={styles.formGrid}>
              <Input
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                placeholder="whatsapp_integration"
                required
                disabled={modalMode === 'edit'}
              />
              <Input
                label="Versão"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0.0"
                required
              />
            </div>
            <Input
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Integração WhatsApp"
              required
            />
            <Input
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Integração do chat com WhatsApp Business API"
            />
            <Input
              label="Pasta do Projeto *"
              value={formData.modulePath}
              onChange={(e) => setFormData({ ...formData, modulePath: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
              placeholder="modulys-pax-baileys-service"
              required
            />
            <div className={styles.formGrid}>
              <Input
                label="Subpasta das Migrations"
                value={formData.migrationsPath}
                onChange={(e) => setFormData({ ...formData, migrationsPath: e.target.value })}
                placeholder="prisma"
              />
              <Input
                label="URL do GitHub (referência)"
                value={formData.repositoryUrl}
                onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                placeholder="https://github.com/empresa/modulo"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {modalMode === 'create' ? 'Criar Módulo' : 'Salvar Alterações'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
