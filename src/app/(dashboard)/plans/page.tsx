'use client';

import { useState, useEffect } from 'react';
import { Plus, CreditCard, Users, Building2, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button, Input, Modal, ModalBody, ModalFooter } from '@/components/ui';
import { plansService, modulesService } from '@/lib/api';
import styles from './page.module.css';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: '',
    maxUsers: '5',
    maxBranches: '1',
    moduleIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansData, modulesData] = await Promise.all([
        plansService.findAll(),
        modulesService.findAll(),
      ]);
      setPlans(plansData);
      setModules(modulesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await plansService.create({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        maxUsers: parseInt(formData.maxUsers),
        maxBranches: parseInt(formData.maxBranches),
        moduleIds: formData.moduleIds,
      });
      setShowModal(false);
      setFormData({ code: '', name: '', description: '', price: '', maxUsers: '5', maxBranches: '1', moduleIds: [] });
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar plano');
    }
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(id => id !== moduleId)
        : [...prev.moduleIds, moduleId]
    }));
  };

  return (
    <>
      <Header title="Planos" subtitle="Gerencie os planos disponíveis" />
      
      <div className={styles.content}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <h2>Planos</h2>
            <p>Total de {plans.length} planos cadastrados</p>
          </div>
          <Button icon={<Plus size={18} />} onClick={() => setShowModal(true)}>
            Novo Plano
          </Button>
        </div>

        {/* Plans Grid */}
        <div className={styles.plansGrid}>
          {plans.length === 0 ? (
            <div className={styles.emptyState}>
              <CreditCard size={56} />
              <h3>Nenhum plano cadastrado</h3>
              <p>Comece criando seu primeiro plano</p>
              <Button icon={<Plus size={18} />} onClick={() => setShowModal(true)}>
                Criar Plano
              </Button>
            </div>
          ) : (
            plans.map((plan, index) => (
              <div 
                key={plan.id} 
                className={`${styles.planCard} ${index === 1 ? styles.featured : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {index === 1 && <div className={styles.planBadge}>Mais Popular</div>}
                <div className={styles.planHeader}>
                  <h3>{plan.name}</h3>
                  <p>{plan.description || 'Plano completo'}</p>
                </div>
                <div className={styles.planPrice}>
                  <span className={styles.currency}>R$</span>
                  <span className={styles.amount}>{Number(plan.price).toFixed(0)}</span>
                  <span className={styles.period}>/mês</span>
                </div>
                <div className={styles.planLimits}>
                  <div className={styles.limitItem}>
                    <Users size={20} />
                    <span>Até <strong>{plan.maxUsers}</strong> usuários</span>
                  </div>
                  <div className={styles.limitItem}>
                    <Building2 size={20} />
                    <span>Até <strong>{plan.maxBranches}</strong> filiais</span>
                  </div>
                </div>
                <div className={styles.planModules}>
                  <span className={styles.modulesTitle}>Módulos inclusos:</span>
                  <ul>
                    {plan.modules?.map((pm: any) => (
                      <li key={pm.moduleId}>
                        <Check size={18} />
                        {pm.module.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.planStats}>
                  <span>{plan._count?.subscriptions || 0} assinaturas ativas</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Plano" size="lg">
        <form onSubmit={handleCreate}>
          <ModalBody>
            <div className={styles.formGrid}>
              <Input
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="professional"
                required
              />
              <Input
                label="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Profissional"
                required
              />
            </div>
            <Input
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Para médias empresas"
            />
            <div className={styles.formGrid3}>
              <Input
                label="Preço (R$/mês)"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="299.90"
                required
              />
              <Input
                label="Máx. Usuários"
                type="number"
                value={formData.maxUsers}
                onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                required
              />
              <Input
                label="Máx. Filiais"
                type="number"
                value={formData.maxBranches}
                onChange={(e) => setFormData({ ...formData, maxBranches: e.target.value })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Módulos inclusos</label>
              <div className={styles.modulesSelector}>
                {modules.map((mod) => (
                  <label key={mod.id} className={styles.moduleCheckbox}>
                    <input
                      type="checkbox"
                      checked={formData.moduleIds.includes(mod.id)}
                      onChange={() => toggleModule(mod.id)}
                    />
                    <span className={styles.checkboxCustom}></span>
                    <span className={styles.moduleName}>{mod.name}</span>
                    {mod.isCore && <span className={styles.coreBadge}>Core</span>}
                  </label>
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Plano</Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
