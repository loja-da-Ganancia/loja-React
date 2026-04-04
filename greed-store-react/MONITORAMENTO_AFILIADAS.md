# 📊 Sistema de Monitoramento de Cliques em Afiliadas - Documentação

## 📌 Visão Geral

Este sistema permite que administradores monitorem e analisem todos os cliques em links de afiliados (TCGPlayer, Amazon, eBay, etc.) realizados por usuários na plataforma.

### ✨ Recursos Principais

- ✅ **Rastreamento Automático**: Registra cada clique em afiliadas com timestamp
- ✅ **Dashboard Analytics**: Visualização de estatísticas em tempo real
- ✅ **Filtros Avançados**: Filtre por afiliada, usuário ou período
- ✅ **Exportação de Dados**: Exporte em CSV ou JSON para análise
- ✅ **Segurança**: Dados armazenados localmente no localStorage
- ✅ **Interface Intuitiva**: Design responsivo e fácil de usar

---

## 🗂️ Estrutura de Arquivos

```
src/
├── hooks/
│   ├── useAffiliateTracking.js    # Hook principal (criar)
│   └── affiliateHelpers.js         # Funções helper (criar)
├── pages/
│   ├── Admin.jsx                   # Admin atualizado com dashboard
│   └── Marketplace.jsx             # Marketplace (integração necessária)
└── EXEMPLO_INTEGRACAO.js           # Exemplos de uso
```

---

## 🚀 Instalação e Configuração

### Passo 1: Criar os hooks necessários

✅ **Já criado**: `/src/hooks/useAffiliateTracking.js`
✅ **Já criado**: `/src/hooks/affiliateHelpers.js`

### Passo 2: Atualizar o Admin.jsx

✅ **Já atualizado** com o novo dashboard de monitoramento

### Passo 3: Integrar no Marketplace (MANUAL)

Você precisa integrar o rastreamento no seu `Marketplace.jsx`.

---

## 🔧 Como Usar - Passo a Passo

### Opção A: Hook `useAffiliateTracking` (Recomendado)

#### 1. Importe o hook:

```javascript
import { useAffiliateTracking } from '../hooks/useAffiliateTracking';
```

#### 2. Use dentro do seu componente:

```javascript
function MeuComponente() {
  const { registrarClique } = useAffiliateTracking();
  
  const userLogado = getCurrentUser(); // Sua função
  const nomeUsuario = userLogado?.username || 'Anônimo';
  
  const abrirAfiliada = (url, afiliada, nomeCarta) => {
    registrarClique(afiliada, nomeCarta, nomeUsuario);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <button onClick={() => abrirAfiliada(url, 'TCGPlayer', 'Blue-Eyes')}>
      Comprar
    </button>
  );
}
```

---

### Opção B: Função Helper Simples

```javascript
import { rastrearCliqueParceiro } from '../hooks/affiliateHelpers';

function MeuComponente() {
  const userLogado = getCurrentUser();
  const nomeUsuario = userLogado?.username || 'Anônimo';
  
  return (
    <a 
      href="#"
      onClick={(e) => {
        e.preventDefault();
        rastrearCliqueParceiro(
          'https://www.amazon.com/...',
          'Amazon',
          'Blue-Eyes White Dragon',
          nomeUsuario
        );
      }}
    >
      Comprar na Amazon
    </a>
  );
}
```

---

## 📝 Integração Específica: Marketplace.jsx

### Localizar a seção de links de afiliadas

No seu `Marketplace.jsx`, procure por esta seção (por volta das linhas 414-445):

```javascript
<a href={`https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(nomeInglesModal)}`} target="_blank" rel="noopener noreferrer">
  <div className="vendor-card">
    <div className="vendor-name">🔵 TCGPlayer</div>
    {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.tcgplayer_price)}
  </div>
</a>
```

### Adicionar o hook no topo do componente:

```javascript
import { useAffiliateTracking } from "../hooks/useAffiliateTracking";
```

### Criar função dentro do componente:

```javascript
function Marketplace() {
  // ... seu código existente ...
  
  const { registrarClique } = useAffiliateTracking();
  const userLogado = getCurrentUser();
  const nomeUsuario = userLogado?.username || 'Anônimo';
  
  const abrirAfiliada = (url, afiliada, nomeCarta) => {
    registrarClique(afiliada, nomeCarta, nomeUsuario);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // ... resto do código ...
}
```

### Substitua os links `<a>` por `<div>` clicáveis:

**Antes:**
```javascript
<a href={url} target="_blank" rel="noopener noreferrer">
  <div className="vendor-card">TCGPlayer</div>
</a>
```

**Depois:**
```javascript
<div 
  onClick={() => abrirAfiliada(
    `https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(nomeInglesModal)}`,
    'TCGPlayer',
    cartaSelecionada.name
  )}
  style={{ cursor: 'pointer' }}
>
  <div className="vendor-card">TCGPlayer</div>
</div>
```

---

## 📊 Dashboard de Administrador

Acesse: **http://localhost:5173/admin**

### Seção: "📊 Monitoramento de Cliques em Afiliadas"

#### Cards de Estatísticas:
- **Total de Cliques**: Número total de cliques registrados
- **Afiliadas Únicas**: Quantas lojas diferentes foram clicadas
- **Usuários Ativos**: Quantos usuários diferentes clicaram
- **Atualizações**: Contador de atualizações do dashboard

#### Gráficos:
- **Cliques por Afiliada**: Distribuição percentual com barras coloridas
- **Top 5 Usuários**: Usuários com mais cliques

#### Filtros:
- Filtre por afiliada específica
- Filtre por usuário específico
- Botão para resetar filtros

#### Ações:
- 📥 **Exportar CSV**: Download em formato de tabela
- 📥 **Exportar JSON**: Download em formato estruturado
- 🔼 **Ver Detalhes**: Mostra tabela com todos os cliques
- 🗑️ **Limpar Tudo**: Apaga todos os registros (com confirmação dupla)

#### Tabela de Detalhes:
Quando expandida, mostra:
- ID do clique
- Afiliada clicada
- Nome da carta
- Usuário que clicou
- Data e hora formatada
- Botão para deletar registro individual

---

## 💾 Estrutura de Dados

### O que é armazenado?

Cada clique registra:

```json
{
  "id": 1704067200000,
  "afiliada": "TCGPlayer",
  "nomeCarta": "Blue-Eyes White Dragon",
  "usuario": "joao123",
  "data": "2024-01-01T12:00:00.000Z",
  "dataLegivel": "01/01/2024 12:00:00"
}
```

### Local de armazenamento:

- **Chave**: `greedstore_affiliate_clicks`
- **Tipo**: localStorage do navegador
- **Tamanho**: Varia conforme número de cliques
- **Persistência**: Mantém dados mesmo após fechar navegador

---

## 🎯 Funções do Hook `useAffiliateTracking`

### `registrarClique(afiliada, nomeCarta, usuario)`

Registra um novo clique.

```javascript
const { registrarClique } = useAffiliateTracking();
registrarClique('Amazon', 'Blue-Eyes White Dragon', 'joao123');
```

---

### `obterTodosOsCliques()`

Retorna array com todos os cliques.

```javascript
const { obterTodosOsCliques } = useAffiliateTracking();
const cliques = obterTodosOsCliques();
console.log(cliques); // Array de objetos
```

---

### `obterEstatisticas()`

Retorna objeto com estatísticas calculadas.

```javascript
const { obterEstatisticas } = useAffiliateTracking();
const stats = obterEstatisticas();

// Retorna:
{
  totalCliques: 42,
  cliquesPorAfiliada: { 'TCGPlayer': 15, 'Amazon': 27 },
  cliquesPorUsuario: { 'joao123': 10, 'maria456': 32 },
  ultimoClique: { ... },
  primeiroClique: { ... }
}
```

---

### `filtrarPorAfiliada(afiliada)`

Filtra cliques por uma afiliada específica.

```javascript
const { filtrarPorAfiliada } = useAffiliateTracking();
const cliquesTCG = filtrarPorAfiliada('TCGPlayer');
```

---

### `filtrarPorUsuario(usuario)`

Filtra cliques de um usuário específico.

```javascript
const { filtrarPorUsuario } = useAffiliateTracking();
const cliquesJoao = filtrarPorUsuario('joao123');
```

---

### `filtrarPorData(dataInicio, dataFim)`

Filtra cliques por período.

```javascript
const { filtrarPorData } = useAffiliateTracking();
const cliques = filtrarPorData('2024-01-01', '2024-01-31');
```

---

### `exportarCSV()`

Exporta dados como arquivo CSV.

```javascript
const { exportarCSV } = useAffiliateTracking();
exportarCSV(); // Baixa arquivo cliques-afiliadas-TIMESTAMP.csv
```

---

### `exportarDados()`

Exporta dados como arquivo JSON.

```javascript
const { exportarDados } = useAffiliateTracking();
exportarDados(); // Baixa arquivo cliques-afiliadas-TIMESTAMP.json
```

---

### `limparDados()`

Apaga todos os registros (com confirmação).

```javascript
const { limparDados } = useAffiliateTracking();
limparDados(); // Abre confirmação dupla
```

---

## 📋 Checklist de Implementação

- [ ] Arquivos de hooks criados em `/src/hooks/`
- [ ] Admin.jsx atualizado com dashboard
- [ ] `useAffiliateTracking` importado no Marketplace
- [ ] Função `abrirAfiliada` criada no Marketplace
- [ ] Links `<a>` substituídos por `<div>` com onClick
- [ ] Testado clique em uma afiliada
- [ ] Verificado se aparece no Admin Dashboard
- [ ] Testado filtro por afiliada
- [ ] Testado filtro por usuário
- [ ] Testado exportação CSV
- [ ] Testado exportação JSON
- [ ] Testado limpeza de dados

---

## 🧪 Como Testar

### 1. Teste o rastreamento:

```javascript
// No console do navegador:
const { registrarClique } = useAffiliateTracking();
registrarClique('TesteLoja', 'CartaTeste', 'usuario_teste');
```

### 2. Verifique o localStorage:

```javascript
// No console:
localStorage.getItem('greedstore_affiliate_clicks')
```

### 3. Acesse o Admin:
- Vá para `http://localhost:5173/admin`
- Verifique se os dados aparecem no dashboard

---

## 🐛 Troubleshooting

### "useAffiliateTracking is not defined"

**Solução**: Certifique-se que o arquivo `/src/hooks/useAffiliateTracking.js` existe e está importando corretamente.

```javascript
import { useAffiliateTracking } from '../hooks/useAffiliateTracking';
```

---

### Dados não aparecem no Admin

**Solução**: 
1. Verifique se o clique foi realmente registrado
2. Abra o DevTools (F12)
3. Verifique localStorage: `localStorage.getItem('greedstore_affiliate_clicks')`
4. Refresque a página do Admin

---

### Erro ao exportar CSV/JSON

**Solução**: Certifique-se que:
1. Existem dados para exportar
2. O navegador permite downloads
3. Verifique permissões de arquivo

---

## 📱 Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Responsivo para mobile
- ⚠️ Requer localStorage habilitado

---

## 🔐 Segurança e Privacidade

### O que é armazenado?
- Nome da afiliada clicada
- Nome da carta visualizada
- Username do usuário (ou "Anônimo")
- Data e hora do clique

### Onde é armazenado?
- Apenas no localStorage do navegador
- Não é enviado para servidor
- Cada usuário só vê seus próprios dados

### Dados sensíveis?
- Não contém senhas
- Não contém informações de pagamento
- Não contém IPs
- Apenas dados de navegação pública

---

## 🚦 Próximos Passos (Opcional)

### Melhorias futuras:

1. **Backend Integration**: Enviar dados para servidor
2. **Gráficos Avançados**: Usar Chart.js ou Recharts
3. **Relatórios Automáticos**: Gerar relatórios por email
4. **Análise Temporal**: Gráficos por hora/dia/semana
5. **Heatmap**: Mostrar quais cartas mais geram cliques
6. **Segmentação**: Agrupar por categoria de usuário

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique o arquivo `EXEMPLO_INTEGRACAO.js`
2. Consulte o código comentado em `useAffiliateTracking.js`
3. Revise o Admin.jsx para referência de implementação

---

## ✅ Status de Implementação

- ✅ Hook `useAffiliateTracking.js` - PRONTO
- ✅ Helper `affiliateHelpers.js` - PRONTO
- ✅ Admin.jsx com dashboard - PRONTO
- ⏳ Integração Marketplace.jsx - MANUAL (ver guia acima)
- ✅ Documentação - COMPLETA

---

**Versão**: 1.0  
**Última atualização**: Abril 2026  
**Status**: Pronto para uso
