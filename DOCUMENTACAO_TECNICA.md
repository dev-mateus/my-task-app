# Documentação Técnica - My Task App

Este documento explica os aspectos técnicos e arquiteturais dos principais arquivos do aplicativo.

---

## 🏗️ Arquitetura Geral

O aplicativo segue uma arquitetura em camadas com separação clara de responsabilidades:

```text
┌─────────────────────────────────────┐
│          App.tsx (View)             │  ← Interface e navegação
├─────────────────────────────────────┤
│      Components (TaskItem/Form)     │  ← Componentes reutilizáveis
├─────────────────────────────────────┤
│       useTasks (Hook/Logic)         │  ← Lógica de negócio e estado
├─────────────────────────────────────┤
│   tasksStorage (Data Access)        │  ← Camada de acesso a dados
├─────────────────────────────────────┤
│      AsyncStorage (Storage)         │  ← Persistência nativa
└─────────────────────────────────────┘
```

**Benefícios desta arquitetura:**

- ✅ Separação de responsabilidades (SoC)
- ✅ Facilita testes unitários
- ✅ Código reutilizável e manutenível
- ✅ Baixo acoplamento entre camadas

---

## 🔷 Tipos TypeScript

### 📄 `src/types/Task.ts`

Define a estrutura de dados de uma tarefa.

```typescript
export type TaskId = string;

export interface Task {
  id: TaskId;
  title: string;
  description?: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  done: boolean;
}
```

#### Conceitos Técnicos

##### 1. Type Alias vs Interface

- `TaskId` é um **type alias**: cria um nome alternativo para `string`
- `Task` é uma **interface**: define a forma de um objeto

##### 2. Propriedades Opcionais (`?`)

- `description?`: pode ser `string | undefined`
- `updatedAt?`: permite valores ausentes

##### 3. Formato de Data ISO 8601

- Padrão: `"2026-02-13T10:30:00.000Z"`
- Benefícios: ordenação alfabética, compatibilidade universal, timezone incluído

##### 4. Boolean Explícito

- `done: boolean` (não opcional) garante que sempre existe um estado
- Evita bugs de valores `undefined`

#### Por que esta estrutura?

- **ID único**: Identificação inequívoca de cada tarefa
- **Timestamps**: Rastreabilidade e ordenação temporal
- **Tipagem forte**: TypeScript previne erros em tempo de compilação

---

## 💾 Camada de Persistência

### 📄 `src/storage/tasksStorage.ts`

Responsável por todas as operações de leitura/escrita no AsyncStorage.

#### Funções Privadas (Helper)

```typescript
async function getAll(): Promise<Task[]>
async function saveAll(tasks: Task[]): Promise<void>
```

- **Encapsulamento**: Apenas o módulo acessa essas funções
- **Single Source of Truth**: Toda leitura/escrita passa por aqui
- **Tratamento de erros**: `try/catch` protege contra JSON inválido

#### Funções Públicas (API)

##### `create()`

```typescript
export async function create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>
```

**Conceitos:**

- **Omit Utility Type**: Remove campos específicos da interface
- **Imutabilidade**: Não modifica o input, retorna novo objeto
- **Timestamps automáticos**: Adiciona `createdAt` e `updatedAt`
- **Prepend no array**: `[newTask, ...tasks]` adiciona no início (mais recentes primeiro)

##### `readAll()`

```typescript
export async function readAll(): Promise<Task[]>
```

- Simples wrapper sobre `getAll()`
- Interface pública consistente

##### `update()`

```typescript
export async function update(id: TaskId, partial: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | undefined>
```

**Conceitos:**

- **Partial Utility Type**: Torna todas as propriedades opcionais
- **Imutabilidade**: Usa spread operator `{...t, ...partial}`
- **Atualização de timestamp**: Sempre atualiza `updatedAt`
- **Retorno condicional**: Retorna `undefined` se ID não existe

##### `remove()`

```typescript
export async function remove(id: TaskId): Promise<void>
```

- **Array.filter**: Cria novo array sem o item removido
- **Idempotência**: Executar múltiplas vezes tem mesmo efeito

##### `clearAll()`

```typescript
export async function clearAll(): Promise<void>
```

- Remove completamente a chave do AsyncStorage
- Diferente de salvar array vazio (economiza espaço)

#### Gerador de IDs

```typescript
function cryptoRandomId(): string
```

**Estratégia de fallback:**

1. **Preferencial**: Web Crypto API (mais seguro, 16 bytes aleatórios)
2. **Fallback**: `Math.random() + timestamp` (menos seguro, mas funcional)

**Por que dois métodos?**

- Ambientes diferentes têm APIs diferentes
- Garante funcionamento em qualquer plataforma

#### Padrões Aplicados

- **Repository Pattern**: Abstração da camada de dados
- **Async/Await**: Código assíncrono legível
- **Error Handling**: Proteção contra falhas de parsing/storage

---

## 🎣 Custom Hook

### 📄 `src/hooks/useTasks.ts`

Hook personalizado que encapsula toda a lógica de estado e operações CRUD.

```typescript
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ... lógica
  
  return { tasks, loading, error, load, createTask, updateTask, removeTask, clear, stats };
}
```

#### Estado Local

##### 1. tasks: Task[]

- Array com todas as tarefas carregadas
- Single source of truth para a UI

##### 2. loading: boolean

- Indica carregamento assíncrono
- Permite mostrar spinners/skeletons

##### 3. error: string | null

- Captura mensagens de erro
- `null` = sem erro

#### Hooks Utilizados

##### `useCallback`

```typescript
const createTask = useCallback(async (input: Pick<Task, 'title' | 'description' | 'done'>) => {
  const t = await store.create(input);
  setTasks(prev => [t, ...prev]);
}, []);
```

**Por que usar:**

- **Memoização**: Mesma referência de função entre renders
- **Performance**: Evita re-renders desnecessários em componentes filhos
- **Dependency array vazio (`[]`)**: Função nunca muda

**Pick Utility Type**: Seleciona apenas campos específicos da interface

##### `useEffect`

```typescript
useEffect(() => {
  load();
}, [load]);
```

**Propósito**: Carrega dados na montagem do componente

- Roda apenas uma vez (se `load` não mudar)
- Pattern: "fetch on mount"

##### `useMemo`

```typescript
const stats = useMemo(() => {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  return { total, done, pending: total - done };
}, [tasks]);
```

**Por que usar:**

- **Computação derivada**: Calcula valores baseados no estado
- **Memoização**: Só recalcula quando `tasks` muda
- **Performance**: Evita recálculos em cada render

#### Padrão Otimista vs Pessimista

**Implementação atual (Pessimista):**

```typescript
const createTask = async (input) => {
  const t = await store.create(input);  // ← Espera persistir
  setTasks(prev => [t, ...prev]);        // ← Atualiza UI
};
```

**Alternativa (Otimista):**

```typescript
// Atualiza UI imediatamente
setTasks(prev => [tempTask, ...prev]);
try {
  await store.create(input);
} catch {
  setTasks(prev => prev.filter(t => t.id !== tempTask.id)); // Reverte
}
```

**Escolha atual**: Pessimista = mais simples, garante consistência

#### Separação de Responsabilidades

- **Hook**: Gerencia estado e orquestra operações
- **Storage**: Executa persistência real
- **Componentes**: Apenas consomem o hook e renderizam

---

## 🧩 Componentes

### 📄 `src/components/TaskItem.tsx`

Componente de apresentação que exibe uma tarefa individual.

#### Props Interface

```typescript
type Props = {
  task: Task;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
};
```

##### Padrão: Dumb/Presentational Component

- Não possui estado interno
- Não acessa dados diretamente
- Recebe tudo via props
- Emite eventos via callbacks

#### Técnicas de Estilização

##### Estilos Condicionais

```typescript
<TouchableOpacity 
  style={[styles.status, task.done && styles.statusDone]} 
/>
```

**Array de estilos**: Permite composição condicional

- `styles.status`: Estilo base (sempre aplicado)
- `task.done && styles.statusDone`: Condicional (aplicado só se `true`)

##### Text Strikethrough

```typescript
<Text style={[styles.title, task.done && styles.titleDone]}>
  {task.title}
</Text>

// styles
titleDone: { 
  textDecorationLine: 'line-through', 
  color: '#777' 
}
```

**UX Pattern**: Indicação visual de conclusão

##### numberOfLines

```typescript
<Text numberOfLines={1}>{task.title}</Text>
<Text numberOfLines={2}>{task.description}</Text>
```

- Trunca texto longo
- Previne layouts quebrados
- Melhor performance (menos elementos)

#### Acessibilidade Implícita

- `TouchableOpacity`: Fornece feedback visual/tátil automático
- Tamanho dos botões: 44x44pt (mínimo recomendado Apple/Google)

---

### 📄 `src/components/TaskForm.tsx`

Formulário reutilizável para criar/editar tarefas.

#### Props e Padrão Controlled Component

```typescript
type Props = {
  initial?: Partial<Task>;
  onSubmit: (data: { title: string; description?: string; done: boolean }) => void;
  submitLabel?: string;
};
```

**Controlled Components**: React controla o estado dos inputs

```typescript
const [title, setTitle] = useState(initial?.title ?? '');

<TextInput
  value={title}
  onChangeText={setTitle}
/>
```

**Fluxo:**

1. Usuário digita
2. `onChangeText` dispara
3. `setTitle` atualiza estado
4. React re-renderiza com novo valor
5. Input mostra o novo valor

#### Optional Chaining e Nullish Coalescing

```typescript
const [title, setTitle] = useState(initial?.title ?? '');
```

- `initial?.title`: Acessa `title` apenas se `initial` não é `null/undefined`
- `?? ''`: Se resultado for `null/undefined`, usa string vazia

#### Effect para Reset

```typescript
useEffect(() => {
  setTitle(initial?.title ?? '');
  setDescription(initial?.description ?? '');
  setDone(initial?.done ?? false);
}, [initial]);
```

**Por que necessário:**

- Hook form pode receber diferentes `initial` values
- Modo criar → Modo editar: Precisa resetar os campos
- Dependency `[initial]`: Re-roda quando `initial` muda

#### Validação Simples

```typescript
<Button
  disabled={title.trim().length === 0}
/>
```

- `.trim()`: Remove espaços em branco
- Previne tarefas com título vazio
- UX: Botão desabilitado indica inválido

#### Data Cleaning no Submit

```typescript
onSubmit({ 
  title: title.trim(), 
  description: description.trim() || undefined, 
  done 
})
```

**Limpeza:**

- `title.trim()`: Remove espaços extras
- `description.trim() || undefined`: Converte string vazia em `undefined`
  - Evita salvar `description: ""`
  - Mais limpo no storage

---

## 🎨 Componente Principal

### 📄 `App.tsx`

Componente raiz que orquestra toda a aplicação.

#### Gerenciamento de Navegação Simples

```typescript
type Screen = 'list' | 'edit';
type EditState = { mode: 'create' } | { mode: 'edit'; task: Task };

const [screen, setScreen] = useState<Screen>('list');
const [editState, setEditState] = useState<EditState>({ mode: 'create' });
```

##### Padrão: State-based Navigation

- Sem biblioteca de navegação (React Navigation)
- Simples para apps pequenos
- Estados discriminados (Union Types)

**Discriminated Unions:**

```typescript
type EditState = 
  | { mode: 'create' }
  | { mode: 'edit'; task: Task };
```

TypeScript sabe que se `mode === 'edit'`, então `task` existe:

```typescript
if (editState.mode === 'edit') {
  console.log(editState.task.title); // ✅ Type-safe
}
```

#### Renderização Condicional

```typescript
{screen === 'edit' ? (
  <SafeAreaView>...</SafeAreaView>
) : (
  <SafeAreaView>...</SafeAreaView>
)}
```

**Alternativas consideradas:**

- Componentes separados: Melhor para apps grandes
- React Navigation: Overkill para 2 telas
- Escolha atual: Simplicidade

#### SafeAreaView e Edges

```typescript
<SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
```

**Por que não 'bottom'?**

- Teclado em dispositivos móveis
- FlatList com scroll gerencia bottom automaticamente
- Previne content hidden por home indicator

#### Alert para Confirmação

```typescript
const confirmDelete = (task: Task) => {
  Alert.alert('Excluir', `Confirma excluir "${task.title}"?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: () => removeTask(task.id) },
  ]);
};
```

##### UX Pattern: Destructive Action Confirmation

- Previne exclusão acidental
- `style: 'destructive'`: iOS mostra em vermelho
- Android: Botão de ação negativa

#### FlatList Otimizada

```typescript
<FlatList
  data={tasks}
  keyExtractor={t => t.id}
  contentContainerStyle={{ padding: 16 }}
  renderItem={({ item }) => <TaskItem... />}
/>
```

**Otimizações:**

- `keyExtractor`: React identifica itens unicamente
- Virtualização automática: Renderiza apenas itens visíveis
- Performance: Lida com milhares de itens

**Por que não .map()?**

```typescript
// ❌ Menos performático
{tasks.map(task => <TaskItem key={task.id} ... />)}

// ✅ Mais performático (virtualização)
<FlatList data={tasks} renderItem={...} />
```

---

## 🔥 Conceitos Avançados Aplicados

### 1. TypeScript Utility Types

- `Partial<T>`: Torna todas propriedades opcionais
- `Omit<T, K>`: Remove propriedades específicas
- `Pick<T, K>`: Seleciona propriedades específicas

### 2. React Hooks

- `useState`: Estado local
- `useEffect`: Efeitos colaterais
- `useCallback`: Memoização de funções
- `useMemo`: Memoização de valores
- Custom Hooks: Lógica reutilizável

### 3. Async/Await

- Código assíncrono legível
- Error handling com try/catch
- Promises implícitas

### 4. Spread Operator

```typescript
const updated = { ...task, ...partial }; // Merge objects
const newArray = [newItem, ...oldArray]; // Prepend array
```

### 5. Immutability

- Nunca modifica estado diretamente
- Sempre cria novos objetos/arrays
- Facilita detecção de mudanças (React reconciliation)

### 6. Functional Programming

- Pure functions
- Array methods: `map`, `filter`, `find`
- Declarativo vs Imperativo

---

## 🧪 Como Testar (Conceitos)

### Unit Tests (Jest)

```typescript
// useTasks.test.ts
test('createTask adiciona tarefa ao array', async () => {
  const { result } = renderHook(() => useTasks());
  await act(async () => {
    await result.current.createTask({ title: 'Test', done: false });
  });
  expect(result.current.tasks).toHaveLength(1);
});
```

### Integration Tests

```typescript
// App.test.tsx
test('criar e editar tarefa', async () => {
  render(<App />);
  fireEvent.press(screen.getByText('+ Nova'));
  fireEvent.changeText(screen.getByPlaceholderText('Título'), 'Teste');
  fireEvent.press(screen.getByText('Salvar'));
  expect(screen.getByText('Teste')).toBeTruthy();
});
```

---

## 📚 Referências e Leitura Adicional

- **TypeScript Handbook**: Utility Types, Generics
- **React Docs**: Hooks, Performance Optimization
- **React Native**: FlatList, AsyncStorage best practices
- **Patterns**: Repository, Custom Hooks, Controlled Components

---

## 🎯 Próximas Melhorias Técnicas

1. **Context API**: Evitar prop drilling em apps maiores
2. **React Query**: Cache e sincronização de dados
3. **Zod/Yup**: Validação de schemas
4. **Error Boundaries**: Captura de erros em componentes
5. **Performance**: React.memo, useDeferredValue
6. **Testing**: Jest + React Testing Library
7. **CI/CD**: GitHub Actions, EAS Build

---

Documento criado para auxiliar no entendimento profundo da arquitetura e decisões técnicas do My Task App.
