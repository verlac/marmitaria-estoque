import React, { useState, useEffect } from 'react';
import './App.css';

export default function EstoqueApp() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductMin, setNewProductMin] = useState('');
  const [newProductQty, setNewProductQty] = useState('');
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [checklistName, setChecklistName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const firebaseConfig = {
    apiKey: "AIzaSyBDIcYFYspgNL55DAQ6ke-OjAtcteb1T7I",
    authDomain: "marmitaria-estoque.firebaseapp.com",
    databaseURL: "https://marmitaria-estoque-default-rtdb.firebaseio.com",
    projectId: "marmitaria-estoque"
  };

  const dbURL = firebaseConfig.databaseURL;

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`${dbURL}/estoque.json`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.products) {
            setProducts(data.products);
            setHistory(data.history || []);
            setChecklists(data.checklists || []);
          } else {
            initializeDefaultData();
          }
        } else {
          initializeDefaultData();
        }
        setIsConnected(true);
      } catch (error) {
        const saved = localStorage.getItem('estoque_data');
        if (saved) {
          const data = JSON.parse(saved);
          setProducts(data.products || []);
          setHistory(data.history || []);
          setChecklists(data.checklists || []);
        } else {
          initializeDefaultData();
        }
      }
    };
    loadData();
  }, []);

  const initializeDefaultData = () => {
    const defaultProducts = [
      { id: 1, name: 'Marmita Individual', qty: 45, min: 20, category: 'marmita' },
      { id: 2, name: 'Marmita Dupla', qty: 30, min: 15, category: 'marmita' },
      { id: 3, name: 'Assado Bovino (kg)', qty: 12, min: 5, category: 'assado' },
      { id: 4, name: 'Assado Frango (kg)', qty: 8, min: 4, category: 'assado' },
      { id: 5, name: 'Açaí (L)', qty: 15, min: 5, category: 'acai' },
      { id: 6, name: 'Sopa Legumes (L)', qty: 20, min: 8, category: 'sopa' }
    ];
    setProducts(defaultProducts);
  };

  const saveData = async (newProducts, newHistory, newChecklists) => {
    const data = { products: newProducts, history: newHistory, checklists: newChecklists };
    localStorage.setItem('estoque_data', JSON.stringify(data));
    try {
      await fetch(`${dbURL}/estoque.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.log('Firebase error');
    }
  };

  const addProduct = () => {
    if (newProductName && newProductMin && newProductQty) {
      const newId = Math.max(...products.map(p => p.id), 0) + 1;
      const newProducts = [...products, {
        id: newId,
        name: newProductName,
        qty: parseInt(newProductQty),
        min: parseInt(newProductMin),
        category: 'outro'
      }];
      setProducts(newProducts);
      saveData(newProducts, history, checklists);
      setNewProductName('');
      setNewProductMin('');
      setNewProductQty('');
      setShowNewProduct(false);
    }
  };

  const updateQty = (id, newQty, type) => {
    const product = products.find(p => p.id === id);
    const newProducts = products.map(p => p.id === id ? { ...p, qty: newQty } : p);
    const newHistory = [...history, {
      id: Date.now(),
      product: product.name,
      type,
      qty: newQty,
      date: new Date().toLocaleString('pt-BR')
    }];
    setProducts(newProducts);
    setHistory(newHistory);
    saveData(newProducts, newHistory, checklists);
  };

  const generateShoppingList = () => {
    return products.filter(p => p.qty < p.min).map(p => ({
      ...p,
      needed: p.min - p.qty
    }));
  };

  const addChecklist = () => {
    if (checklistName) {
      const newChecklists = [...checklists, {
        id: Date.now(),
        name: checklistName,
        items: [],
        completed: false
      }];
      setChecklists(newChecklists);
      saveData(products, history, newChecklists);
      setChecklistName('');
      setShowNewChecklist(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copiado!');
  };

  const shoppingList = generateShoppingList();
  const lowStockCount = products.filter(p => p.qty < p.min).length;

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Estoque Marmitaria</h1>
          <div className="status">{isConnected ? '🟢 Conectado ao Firebase' : '🟡 Usando dados locais'}</div>
        </div>
        <button className="share-btn" onClick={() => setShowShareModal(!showShareModal)}>
          📤 Compartilhar
        </button>
      </div>

      {showShareModal && (
        <div className="modal">
          <div className="modal-title">Compartilhe com seu chefe</div>
          <div className="modal-text">Copie o link abaixo e envie para seu chefe.</div>
          <button className="modal-btn" onClick={copyShareLink}>📋 Copiar link</button>
        </div>
      )}

      <div className="tabs">
        {['dashboard', 'estoque', 'compras', 'checklist', 'historico'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="content">
          <h2>Resumo do estoque</h2>
          <div className="metrics">
            <div className="metric"><div className="metric-label">Total</div><div className="metric-value">{products.length}</div></div>
            <div className="metric"><div className="metric-label">Baixo</div><div className="metric-value danger">{lowStockCount}</div></div>
            <div className="metric"><div className="metric-label">Comprar</div><div className="metric-value">{shoppingList.length}</div></div>
          </div>

          {lowStockCount > 0 && (
            <div className="alert">
              <div className="alert-title">⚠️ Estoque baixo</div>
              <div>{products.filter(p => p.qty < p.min).map(p => p.name).join(', ')}</div>
            </div>
          )}

          <h3>Produtos</h3>
          <div className="products-list">
            {products.map(p => (
              <div key={p.id} className="product-item">
                <div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-info">Atual: {p.qty} | Mín: {p.min}</div>
                </div>
                <div>{p.qty < p.min ? '🔴' : '🟢'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'estoque' && (
        <div className="content">
          <div className="section-header">
            <h2>Controle de estoque</h2>
            <button className="btn-small" onClick={() => setShowNewProduct(!showNewProduct)}>+ Novo</button>
          </div>

          {showNewProduct && (
            <div className="form-box">
              <input type="text" placeholder="Nome" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
              <div className="form-row">
                <input type="number" placeholder="Qtd" value={newProductQty} onChange={(e) => setNewProductQty(e.target.value)} />
                <input type="number" placeholder="Mín" value={newProductMin} onChange={(e) => setNewProductMin(e.target.value)} />
              </div>
              <button className="btn-success" onClick={addProduct}>Adicionar</button>
            </div>
          )}

          <div className="products-control">
            {products.map(p => (
              <div key={p.id} className="control-item">
                <div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-info">Mín: {p.min}</div>
                </div>
                <div className="qty-control">
                  <button onClick={() => updateQty(p.id, Math.max(0, p.qty - 1), 'saída')}>−</button>
                  <div className="qty-display">{p.qty}</div>
                  <button onClick={() => updateQty(p.id, p.qty + 1, 'entrada')}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'compras' && (
        <div className="content">
          <h2>Lista de compras</h2>
          {shoppingList.length === 0 ? (
            <div className="empty">Estoque completo!</div>
          ) : (
            <div className="shopping-list">
              {shoppingList.map(p => (
                <div key={p.id} className="shopping-item">
                  <div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-info">Atual: {p.qty} | Mín: {p.min}</div>
                  </div>
                  <div className="badge-warning">Comprar {p.needed}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'checklist' && (
        <div className="content">
          <div className="section-header">
            <h2>Checklists</h2>
            <button className="btn-small" onClick={() => setShowNewChecklist(!showNewChecklist)}>+ Novo</button>
          </div>

          {showNewChecklist && (
            <div className="form-box">
              <input type="text" placeholder="Nome do checklist" value={checklistName} onChange={(e) => setChecklistName(e.target.value)} />
              <button className="btn-success" onClick={addChecklist}>Criar</button>
            </div>
          )}

          {checklists.length === 0 ? (
            <div className="empty">Nenhum checklist criado</div>
          ) : (
            <div className="checklists-list">
              {checklists.map(c => (
                <div key={c.id} className="checklist-item">
                  <div className="checklist-name">{c.name}</div>
                  <button 
                    className={c.completed ? 'btn-completed' : 'btn-pending'}
                    onClick={() => {
                      const newChecklists = checklists.map(ch => ch.id === c.id ? { ...ch, completed: !ch.completed } : ch);
                      setChecklists(newChecklists);
                      saveData(products, history, newChecklists);
                    }}
                  >
                    {c.completed ? '✓ Concluído' : 'Concluir'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'historico' && (
        <div className="content">
          <h2>Histórico</h2>
          {history.length === 0 ? (
            <div className="empty">Nenhuma movimentação</div>
          ) : (
            <div className="history-list">
              {history.slice().reverse().map(h => (
                <div key={h.id} className="history-item">
                  <div>
                    <div className="product-name">{h.product}</div>
                    <div className="product-info">{h.date}</div>
                  </div>
                  <div className={h.type === 'entrada' ? 'success' : 'danger'}>
                    {h.type === 'entrada' ? '+' : '−'} {h.qty}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
