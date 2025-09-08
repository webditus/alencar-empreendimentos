# 👁️ Sistema de Ativação/Desativação - Categorias e Itens

## 🎯 Funcionalidade Implementada

O sistema agora permite ativar/desativar categorias e itens individualmente, controlando sua visibilidade na calculadora de preços.

## ✨ Características

### **Para Categorias:**
- ✅ **Ícone de olho** - Verde quando ativo, cinza quando inativo
- ✅ **Indicação visual** - Nome e ícone ficam cinza quando inativo
- ✅ **Marcação "(Inativo)"** - Texto vermelho ao lado do nome
- ✅ **Filtro automático** - Categorias inativas não aparecem na calculadora

### **Para Itens:**
- ✅ **Ícone de olho** - Verde quando ativo, cinza quando inativo  
- ✅ **Indicação visual** - Nome e preço ficam cinza quando inativo
- ✅ **Marcação "(Inativo)"** - Texto vermelho ao lado do nome
- ✅ **Filtro automático** - Itens inativos não aparecem na calculadora

## 🔧 Como Usar

### **Desativar Categoria:**
1. Acesse **Admin → Categorias**
2. Clique no **ícone de olho verde** ao lado do nome da categoria
3. A categoria ficará **cinza** e marcada como **(Inativo)**
4. **Não aparecerá** na calculadora de preços

### **Desativar Item:**
1. Acesse **Admin → Categorias**
2. Encontre o item desejado
3. Clique no **ícone de olho verde** ao lado do nome do item
4. O item ficará **cinza** e marcado como **(Inativo)**
5. **Não aparecerá** na calculadora de preços

### **Reativar:**
- Clique no **ícone de olho cinza** para reativar
- O elemento volta a ficar **verde** e **visível na calculadora**

## 🎨 Indicações Visuais

| Status | Ícone | Cor do Nome | Cor do Preço | Marcação |
|--------|-------|-------------|--------------|----------|
| **Ativo** | 👁️ Verde | Preto | Verde | - |
| **Inativo** | 👁️‍🗨️ Cinza | Cinza | Cinza | (Inativo) |

## 🔄 Comportamento na Calculadora

### **Filtros Aplicados:**
- ✅ **Categorias inativas** → Não aparecem
- ✅ **Itens inativos** → Não aparecem
- ✅ **Categorias sem itens ativos** → Não aparecem

### **Exemplo Prático:**
```
Categoria: "Estrutura" (Ativa)
├── Item A (Ativo) ✅ → Aparece na calculadora
├── Item B (Inativo) ❌ → NÃO aparece na calculadora
└── Item C (Ativo) ✅ → Aparece na calculadora

Categoria: "Banheiro" (Inativa) ❌ → NÃO aparece na calculadora
├── Item D (Ativo) ❌ → NÃO aparece (categoria inativa)
└── Item E (Ativo) ❌ → NÃO aparece (categoria inativa)
```

## 🗄️ Banco de Dados

### **Colunas Adicionadas:**
- `categories.is_active` (BOOLEAN, default: true)
- `items.is_active` (BOOLEAN, default: true)

### **Script de Atualização:**
Execute o arquivo `supabase_add_is_active_columns.sql` no Supabase SQL Editor.

## 🔄 Compatibilidade

### **Dados Existentes:**
- ✅ **Retrocompatível** - Todos os registros existentes ficam ativos por padrão
- ✅ **Sem breaking changes** - Sistema funciona normalmente se campos não existirem

### **Fallback:**
- Se `isActive` for `undefined` ou `null` → Considerado **ativo**
- Garante funcionamento mesmo com dados antigos

## 📋 Checklist de Implementação

### **Backend:**
- ✅ Campo `is_active` nas tabelas
- ✅ Métodos `toggleCategoryStatus()` e `toggleItemStatus()`
- ✅ Filtros no `CategoryService.getAllCategories()`

### **Context:**
- ✅ Métodos `toggleCategoryStatus()` e `toggleItemStatus()` no Context
- ✅ Filtro automático no `categories` computed
- ✅ Exclusão de categorias vazias (sem itens ativos)

### **Interface:**
- ✅ Ícones Eye/EyeOff para toggle
- ✅ Estados visuais (cores, indicações)
- ✅ Tooltips explicativos
- ✅ Marcação "(Inativo)" em texto

### **TypeScript:**
- ✅ Campo `isActive?` nas interfaces `Category` e `Item`
- ✅ Métodos tipados nos services e contexts

## 🧪 Como Testar

### **1. Teste Básico:**
```
1. Acesse Admin → Categorias
2. Desative uma categoria (clique no olho)
3. Acesse a calculadora de preços
4. Verifique se a categoria NÃO aparece
```

### **2. Teste de Item:**
```
1. Desative um item específico
2. Acesse a calculadora de preços  
3. Verifique se apenas aquele item NÃO aparece
4. Outros itens da categoria devem aparecer normalmente
```

### **3. Teste de Reativação:**
```
1. Reative categoria/item (clique no olho cinza)
2. Acesse a calculadora de preços
3. Verifique se volta a aparecer
```

## 🎉 Benefícios

- ✅ **Controle granular** - Ative/desative sem deletar
- ✅ **Gestão flexível** - Esconda temporariamente itens
- ✅ **Manutenção fácil** - Sem impacto em orçamentos existentes
- ✅ **UX intuitiva** - Ícone de olho universalmente reconhecido
- ✅ **Performance** - Filtros otimizados no banco e frontend

---

**🎯 Sistema totalmente funcional e integrado!**

A funcionalidade permite controle total da visibilidade de categorias e itens na calculadora, mantendo a flexibilidade para reativar quando necessário.
