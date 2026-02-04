'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Mail, Phone, Check, Puzzle, Package, Pencil, Trash2, Database, Play, Wand2, Power, FileCode2, Download } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button, Input, Modal, ModalBody, ModalFooter } from '@/components/ui';
import { tenantsService, plansService, modulesService, provisioningService, migrationsService, templatesService, downloadProjectZip } from '@/lib/api';
import styles from './page.module.css';

type ConfigMode = 'template' | 'custom';
type ModalMode = 'create' | 'edit';

// Máscaras
const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14);
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [configMode, setConfigMode] = useState<ConfigMode>('custom');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    document: '',
    email: '',
    phone: '',
    planId: '',
    moduleIds: [] as string[],
  });
  const [loadingTenantId, setLoadingTenantId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [tenantForGenerate, setTenantForGenerate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tenantsData, plansData, modulesData] = await Promise.all([
        tenantsService.findAll(),
        plansService.findAll(),
        modulesService.findAll(),
      ]);
      setTenants(tenantsData);
      setPlans(plansData);
      setModules(modulesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        const payload: any = {
          code: formData.code,
          name: formData.name,
          document: formData.document,
          email: formData.email,
          phone: formData.phone,
        };

        // Adiciona módulos de acordo com o modo
        if (configMode === 'template' && formData.planId) {
          payload.planId = formData.planId;
        } else if (configMode === 'custom' && formData.moduleIds.length > 0) {
          payload.moduleIds = formData.moduleIds;
        }

        await tenantsService.create(payload);
      } else {
        // Edição - só atualiza campos editáveis
        await tenantsService.update(selectedTenant.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        });

        // Atualiza módulos se mudou
        if (formData.moduleIds.length > 0) {
          await tenantsService.setModules(selectedTenant.id, formData.moduleIds);
        }
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      alert(error.message || `Erro ao ${modalMode === 'create' ? 'criar' : 'atualizar'} cliente`);
    }
  };

  const handleEdit = (tenant: any) => {
    setSelectedTenant(tenant);
    setModalMode('edit');
    setFormData({
      code: tenant.code,
      name: tenant.name,
      document: tenant.document,
      email: tenant.email,
      phone: tenant.phone || '',
      planId: '',
      moduleIds: tenant.modules?.map((m: any) => m.moduleId) || [],
    });
    setConfigMode('custom');
    setShowModal(true);
  };

  const handleActivate = async (tenant: any) => {
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'ativar' : 'suspender';
    
    if (!confirm(`Deseja ${action} o cliente "${tenant.name}"?`)) {
      return;
    }

    try {
      await tenantsService.updateStatus(tenant.id, newStatus);
      loadData();
      alert(`Cliente ${newStatus === 'ACTIVE' ? 'ativado' : 'suspenso'} com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      alert(error.response?.data?.message || `Erro ao ${action} cliente`);
    }
  };

  const handleDelete = async (tenant: any) => {
    let confirmMsg: string;
    
    if (tenant.isProvisioned) {
      confirmMsg = `ATENÇÃO: O cliente "${tenant.name}" já foi provisionado!\n\n` +
        `Banco de dados: ${tenant.databaseName}\n` +
        `Usuário: ${tenant.databaseUser}\n\n` +
        `Ao confirmar, o banco de dados e o usuário serão REMOVIDOS PERMANENTEMENTE do PostgreSQL.\n\n` +
        `Esta ação NÃO pode ser desfeita. Deseja continuar?`;
    } else {
      confirmMsg = `Tem certeza que deseja excluir o cliente "${tenant.name}"?\n\nEsta ação não pode ser desfeita.`;
    }
    
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const result = await tenantsService.delete(tenant.id);
      
      // Mostra mensagem de sucesso com detalhes
      if (result.wasProvisioned) {
        if (result.databaseDropped && result.userDropped) {
          alert(`Cliente excluído com sucesso!\n\n✓ Banco "${result.databaseName}" removido\n✓ Usuário "${result.databaseUser}" removido`);
        } else if (result.dropError) {
          alert(`Cliente excluído, mas houve um problema ao remover o banco:\n\n${result.dropError}\n\nVerifique manualmente no PostgreSQL.`);
        }
      }
      
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir cliente');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTenant(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', document: '', email: '', phone: '', planId: '', moduleIds: [] });
    setConfigMode('custom');
    setSelectedTenant(null);
  };

  const handleProvision = async (tenantId: string) => {
    if (!confirm('Deseja provisionar o banco de dados para este cliente?')) return;
    
    setLoadingTenantId(tenantId);
    try {
      const result = await provisioningService.provision(tenantId);
      alert(`Banco provisionado com sucesso!\n\nDatabase: ${result.database?.name || result.databaseName}`);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao provisionar');
    } finally {
      setLoadingTenantId(null);
    }
  };

  const handleApplyMigrations = async (tenantId: string) => {
    if (!confirm('Deseja aplicar as migrations para este cliente? Isso criará as tabelas do sistema.')) return;
    
    setLoadingTenantId(tenantId);
    try {
      const result = await migrationsService.apply(tenantId);
      alert(`Migrations aplicadas com sucesso!\n\n${result.message || 'Tabelas criadas no banco do cliente.'}`);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao aplicar migrations');
    } finally {
      setLoadingTenantId(null);
    }
  };

  const openGenerateModal = async (tenant: any) => {
    setTenantForGenerate(tenant);
    setSelectedTemplateId('');
    setShowGenerateModal(true);
    try {
      const list = await templatesService.findAll();
      setTemplates(list);
      if (list.length > 0) setSelectedTemplateId(list[0].id);
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar templates');
    }
  };

  const handleGenerateProject = async () => {
    if (!tenantForGenerate || !selectedTemplateId) {
      alert('Selecione um template');
      return;
    }
    setLoadingGenerate(true);
    try {
      await downloadProjectZip(tenantForGenerate.id, selectedTemplateId);
      alert('Download iniciado! O ZIP contém frontend/ e backend/. Descompacte e configure .env em cada pasta.');
      setShowGenerateModal(false);
      setTenantForGenerate(null);
    } catch (error: any) {
      alert(error.message || 'Erro ao gerar projeto');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const current = formData.moduleIds;
    const isCore = modules.find(m => m.id === moduleId)?.isCore;
    
    // Não permite desmarcar módulos core
    if (isCore) return;
    
    if (current.includes(moduleId)) {
      setFormData({ ...formData, moduleIds: current.filter(id => id !== moduleId) });
    } else {
      setFormData({ ...formData, moduleIds: [...current, moduleId] });
    }
  };

  // Quando selecionar um plano, mostra os módulos que virão
  const selectedPlan = plans.find(p => p.id === formData.planId);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.document.includes(search) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const coreModules = modules.filter(m => m.isCore);
  const optionalModules = modules.filter(m => !m.isCore);

  // Auto-fill para desenvolvimento
  const isDev = process.env.NODE_ENV === 'development';
  
  const handleDevAutoFill = () => {
    setFormData({
      code: `translog`,
      name: 'Translog Express',
      document: '00.000.000/0000-00',
      email: `translog@mail.com`,
      phone: '(00) 00000-0000',
      planId: '',
      moduleIds: coreModules.map(m => m.id),
    });
    setConfigMode('custom');
  };

  return (
    <>
      <Header title="Clientes" subtitle="Gerencie os clientes da plataforma" />
      
      <div className={styles.content}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <h2>Clientes</h2>
            <p>Total de {tenants.length} cliente{tenants.length !== 1 ? 's' : ''} cadastrado{tenants.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={styles.pageActions}>
            <Button icon={<Plus size={18} />} onClick={openCreateModal}>
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tenants Grid */}
        <div className={styles.tenantsGrid}>
          {filteredTenants.length === 0 ? (
            <div className={styles.emptyState}>
              <Building2 size={56} />
              <h3>Nenhum cliente encontrado</h3>
              <p>Comece adicionando seu primeiro cliente</p>
              <Button icon={<Plus size={18} />} onClick={openCreateModal}>
                Adicionar Cliente
              </Button>
            </div>
          ) : (
            filteredTenants.map((tenant, index) => (
              <div 
                key={tenant.id} 
                className={styles.tenantCard}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.tenantAvatar}>
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.cardActions}>
                    <button 
                      className={styles.cardActionBtn} 
                      onClick={() => handleEdit(tenant)}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      className={`${styles.cardActionBtn} ${styles.deleteBtn}`} 
                      onClick={() => handleDelete(tenant)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      className={`${styles.cardActionBtn} ${tenant.status === 'ACTIVE' ? styles.suspendBtn : styles.activateBtn}`} 
                      onClick={() => handleActivate(tenant)}
                      title={tenant.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${styles[tenant.status?.toLowerCase() || 'pending']}`}>
                  {tenant.status === 'ACTIVE' && 'Ativo'}
                  {tenant.status === 'TRIAL' && 'Trial'}
                  {tenant.status === 'PENDING' && 'Pendente'}
                  {tenant.status === 'SUSPENDED' && 'Suspenso'}
                  {!tenant.status && 'Pendente'}
                </span>
                <div className={styles.cardBody}>
                  <h3>{tenant.name}</h3>
                  <p className={styles.tenantCode}>{tenant.code}</p>
                  <div className={styles.details}>
                    <div className={styles.detailItem}>
                      <Building2 size={14} />
                      <span>{tenant.document}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Mail size={14} />
                      <span>{tenant.email}</span>
                    </div>
                    {tenant.phone && (
                      <div className={styles.detailItem}>
                        <Phone size={14} />
                        <span>{tenant.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Módulos do tenant */}
                  {tenant.modules && tenant.modules.length > 0 && (
                    <div className={styles.tenantModules}>
                      <span className={styles.modulesLabel}>
                        <Puzzle size={14} /> Módulos:
                      </span>
                      <div className={styles.modulesTags}>
                        {tenant.modules.slice(0, 3).map((tm: any) => (
                          <span key={tm.id} className={styles.moduleTag}>
                            {tm.module?.name || 'N/A'}
                          </span>
                        ))}
                        {tenant.modules.length > 3 && (
                          <span className={styles.moduleTagMore}>
                            +{tenant.modules.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  {!tenant.isProvisioned ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleProvision(tenant.id)}
                      icon={<Database size={16} />}
                      style={{ width: '100%' }}
                      loading={loadingTenantId === tenant.id}
                      disabled={loadingTenantId !== null}
                    >
                      {loadingTenantId === tenant.id ? 'Provisionando...' : 'Provisionar Banco'}
                    </Button>
                  ) : !tenant.modules?.some((m: any) => m.migrationsApplied) ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleApplyMigrations(tenant.id)}
                      icon={<Play size={16} />}
                      style={{ width: '100%' }}
                      loading={loadingTenantId === tenant.id}
                      disabled={loadingTenantId !== null}
                    >
                      {loadingTenantId === tenant.id ? 'Aplicando...' : 'Aplicar Migrations'}
                    </Button>
                  ) : (
                    <>
                      <div className={styles.provisionedBadge}>
                        <Check size={16} />
                        Sistema Configurado
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGenerateModal(tenant)}
                        icon={<Download size={16} />}
                        style={{ width: '100%', marginTop: 8 }}
                      >
                        Criar projeto (ZIP)
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Gerar Projeto (ZIP) */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => { setShowGenerateModal(false); setTenantForGenerate(null); }}
        title="Criar projeto (frontend + backend)"
        size="md"
      >
        <ModalBody>
          {tenantForGenerate && (
            <p className={styles.generateInfo}>
              Cliente: <strong>{tenantForGenerate.name}</strong> ({tenantForGenerate.code}). O ZIP inclui pasta <strong>frontend</strong> e pasta <strong>backend</strong> (login + proxy Core/Chat).
            </p>
          )}
          <div className={styles.formGroup}>
            <label>Template</label>
            <select
              className={styles.select}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={() => { setShowGenerateModal(false); setTenantForGenerate(null); }}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGenerateProject}
            disabled={!selectedTemplateId || loadingGenerate}
            loading={loadingGenerate}
            icon={<Download size={16} />}
          >
            {loadingGenerate ? 'Gerando...' : 'Baixar ZIP'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal Criar/Editar Cliente */}
      <Modal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); resetForm(); }} 
        title={modalMode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {/* Botão Dev Auto-fill */}
            {isDev && modalMode === 'create' && (
              <div className={styles.devAutoFill}>
                <button
                  type="button"
                  className={styles.devAutoFillBtn}
                  onClick={handleDevAutoFill}
                  title="Preencher automaticamente (apenas dev)"
                >
                  <Wand2 size={16} />
                  Auto-preencher (Dev)
                </button>
              </div>
            )}

            {/* Dados básicos */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <Building2 size={18} />
                Dados da Empresa
              </h4>
              <div className={styles.formGrid}>
                <Input
                  label="Código"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="translog"
                  required
                  disabled={modalMode === 'edit'}
                />
                <Input
                  label="CNPJ"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: maskCNPJ(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                  required
                  disabled={modalMode === 'edit'}
                />
              </div>
              <Input
                label="Nome da Empresa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="TransLog Transportes"
                required
              />
              <div className={styles.formGrid}>
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                  required
                />
              <Input
                label="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                placeholder="(11) 99999-9999"
              />
              </div>
            </div>

            {/* Configuração de módulos */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>
                <Puzzle size={18} />
                Configuração de Módulos
              </h4>
              
              {/* Tabs de modo */}
              <div className={styles.modeTabs}>
                <button
                  type="button"
                  className={`${styles.modeTab} ${configMode === 'custom' ? styles.active : ''}`}
                  onClick={() => { setConfigMode('custom'); setFormData({ ...formData, planId: '' }); }}
                >
                  <Puzzle size={16} />
                  Personalizado
                </button>
                <button
                  type="button"
                  className={`${styles.modeTab} ${configMode === 'template' ? styles.active : ''}`}
                  onClick={() => { setConfigMode('template'); setFormData({ ...formData, moduleIds: [] }); }}
                >
                  <Package size={16} />
                  Usar Template (Plano)
                </button>
              </div>

              {configMode === 'custom' ? (
                <div className={styles.modulesSelection}>
                  {/* Módulos Core (sempre incluídos) */}
                  {coreModules.length > 0 && (
                    <div className={styles.moduleGroup}>
                      <span className={styles.moduleGroupLabel}>Módulos Essenciais (incluídos automaticamente)</span>
                      <div className={styles.modulesList}>
                        {coreModules.map(mod => (
                          <div key={mod.id} className={`${styles.moduleItem} ${styles.coreModule}`}>
                            <Check size={16} />
                            <span>{mod.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Módulos Opcionais */}
                  <div className={styles.moduleGroup}>
                    <span className={styles.moduleGroupLabel}>Módulos Disponíveis</span>
                    <div className={styles.modulesList}>
                      {optionalModules.map(mod => {
                        const isSelected = formData.moduleIds.includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            className={`${styles.moduleItem} ${isSelected ? styles.selected : ''}`}
                            onClick={() => toggleModule(mod.id)}
                          >
                            <div className={styles.moduleCheck}>
                              {isSelected && <Check size={14} />}
                            </div>
                            <div className={styles.moduleInfo}>
                              <span className={styles.moduleName}>{mod.name}</span>
                              {mod.description && (
                                <span className={styles.moduleDesc}>{mod.description}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.planSelection}>
                  <div className={styles.plansList}>
                    {plans.length === 0 ? (
                      <p className={styles.noPlans}>Nenhum plano cadastrado. Crie um plano primeiro ou use o modo personalizado.</p>
                    ) : (
                      plans.map(plan => (
                        <button
                          key={plan.id}
                          type="button"
                          className={`${styles.planItem} ${formData.planId === plan.id ? styles.selected : ''}`}
                          onClick={() => setFormData({ ...formData, planId: plan.id })}
                        >
                          <div className={styles.planRadio}>
                            {formData.planId === plan.id && <div className={styles.planRadioInner} />}
                          </div>
                          <div className={styles.planInfo}>
                            <span className={styles.planName}>{plan.name}</span>
                            <span className={styles.planPrice}>
                              R$ {Number(plan.price).toFixed(0)}/mês
                            </span>
                            {plan.modules && plan.modules.length > 0 && (
                              <div className={styles.planModules}>
                                {plan.modules.map((pm: any) => (
                                  <span key={pm.id} className={styles.planModuleTag}>
                                    {pm.module?.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button type="submit">
              {modalMode === 'create' ? 'Cadastrar Cliente' : 'Salvar Alterações'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
