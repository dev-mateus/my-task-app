# Guia Completo: Como Criar o App de Tarefas React Native

Este guia passo a passo mostra como recriar do zero este aplicativo de gerenciamento de tarefas usando React Native com Expo.

## 📋 Visão Geral do Projeto

**Nome:** my-task-app  
**Tecnologias:**

- React Native 0.81.5
- Expo SDK 54
- TypeScript 5.9.2
- React 19.1.0
- AsyncStorage para persistência local

**Funcionalidades:**

- Criar, editar e excluir tarefas
- Marcar tarefas como concluídas/pendentes
- Persistência local dos dados
- Estatísticas (total, concluídas, pendentes)
- Interface responsiva com navegação entre telas

---

## 🚀 Passo 1: Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** (versão 18 ou superior)  
   Download: <https://nodejs.org/>

2. **npm** ou **yarn** (geralmente vem com Node.js)

3. **Expo CLI** (será instalado com o projeto)

4. **Expo Go App** no celular (para testar)
   - Android: Google Play Store
   - iOS: Apple App Store

5. **Editor de código** (recomendado: VS Code)

---

## 📦 Passo 2: Criar o Projeto Expo

Abra o terminal na pasta onde deseja criar o projeto e execute:

```powershell

# Criar projeto com Expo (template blank com TypeScript)
npx create-expo-app my-task-app --template blank-typescript

# Entrar na pasta do projeto
cd my-task-app
```

---

## 🔧 Passo 3: Instalar Dependências

No terminal, dentro da pasta do projeto, execute:

```powershell
# Instalar AsyncStorage para persistência de dados
npx expo install @react-native-async-storage/async-storage

# Instalar SafeAreaView para lidar com áreas seguras (notch, etc)
npx expo install react-native-safe-area-context

# Instalar dependências de desenvolvimento TypeScript
npm install --save-dev @types/react typescript
```

---

## 📁 Passo 4: Criar a Estrutura de Pastas

Execute os seguintes comandos para criar a estrutura de diretórios:

```powershell
# Criar estrutura de pastas
New-Item -ItemType Directory -Path src
New-Item -ItemType Directory -Path src\components
New-Item -ItemType Directory -Path src\hooks
New-Item -ItemType Directory -Path src\storage
New-Item -ItemType Directory -Path src\types
```

A estrutura final será:

```text
my-task-app/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── storage/
│   └── types/
├── assets/
├── App.tsx
├── package.json
└── tsconfig.json
```

---

## 📝 Passo 5: Criar os Arquivos TypeScript

### 5.1 - Criar o tipo Task

Crie o arquivo `src/types/Task.ts`:

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

### 5.2 - Criar o Storage (persistência)

Crie o arquivo `src/storage/tasksStorage.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskId } from '../types/Task';

const STORAGE_KEY = '@mycrud/tasks';

async function getAll(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export async function create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const tasks = await getAll();
  const now = new Date().toISOString();
  const newTask: Task = {
    id: cryptoRandomId(),
    title: task.title,
    description: task.description,
    createdAt: now,
    updatedAt: now,
    done: task.done ?? false,
  };
  const updated = [newTask, ...tasks];
  await saveAll(updated);
  return newTask;
}

export async function readAll(): Promise<Task[]> {
  return getAll();
}

export async function readById(id: TaskId): Promise<Task | undefined> {
  const tasks = await getAll();
  return tasks.find(t => t.id === id);
}

export async function update(id: TaskId, partial: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | undefined> {
  const tasks = await getAll();
  let updatedTask: Task | undefined;
  const updated = tasks.map(t => {
    if (t.id === id) {
      updatedTask = {
        ...t,
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      return updatedTask;
    }
    return t;
  });
  await saveAll(updated);
  return updatedTask;
}

export async function remove(id: TaskId): Promise<void> {
  const tasks = await getAll();
  const filtered = tasks.filter(t => t.id !== id);
  await saveAll(filtered);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Gerador simples de IDs
function cryptoRandomId(): string {
  // Usa Web Crypto quando disponível no ambiente
  try {
    const bytes = new Uint8Array(16);
    // @ts-ignore
    (globalThis.crypto || (globalThis as any).nativeCrypto)?.getRandomValues?.(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
```

### 5.3 - Criar o Hook useTasks

Crie o arquivo `src/hooks/useTasks.ts`:

```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Task, TaskId } from '../types/Task';
import * as store from '../storage/tasksStorage';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await store.readAll();
      setTasks(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = useCallback(async (input: Pick<Task, 'title' | 'description' | 'done'>) => {
    const t = await store.create(input);
    setTasks(prev => [t, ...prev]);
  }, []);

  const updateTask = useCallback(async (id: TaskId, partial: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    const t = await store.update(id, partial);
    if (t) {
      setTasks(prev => prev.map(p => (p.id === id ? t : p)));
    }
  }, []);

  const removeTask = useCallback(async (id: TaskId) => {
    await store.remove(id);
    setTasks(prev => prev.filter(p => p.id !== id));
  }, []);

  const clear = useCallback(async () => {
    await store.clearAll();
    setTasks([]);
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    return { total, done, pending: total - done };
  }, [tasks]);

  return { tasks, loading, error, load, createTask, updateTask, removeTask, clear, stats };
}
```

### 5.4 - Criar o Componente TaskItem

Crie o arquivo `src/components/TaskItem.tsx`:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../types/Task';

type Props = {
  task: Task;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TaskItem({ task, onToggleDone, onEdit, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggleDone} style={[styles.status, task.done && styles.statusDone]} />
      <View style={styles.content}>
        <Text style={[styles.title, task.done && styles.titleDone]} numberOfLines={1}>
          {task.title}
        </Text>
        {!!task.description && (
          <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.action}>
        <Text style={styles.actionText}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={[styles.action, styles.delete]}>
        <Text style={styles.actionText}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: 
  { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    marginBottom: 8, 
    elevation: 1 
},
  status: 
  { 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    borderWidth: 2, 
    borderColor: '#999', 
    marginRight: 12 
},
  statusDone: 
  { 
    backgroundColor: '#4caf50', 
    borderColor: '#4caf50' 
},
  content: 
  { 
    flex: 1 
},
  title: 
  { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111' 
},
  titleDone: 
  { 
    textDecorationLine: 'line-through', 
    color: '#777' 
},
  desc: 
  { 
    fontSize: 13, 
    color: '#666', 
    marginTop: 4 
},
  action: 
  { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    backgroundColor: '#1976d2', 
    borderRadius: 6, 
    marginLeft: 6 
},
  delete: 
  { 
    backgroundColor: '#d32f2f' 
},
  actionText: 
  { 
    color: '#fff', 
    fontWeight: '600' },
});
```

### 5.5 - Criar o Componente TaskForm

Crie o arquivo `src/components/TaskForm.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, TextInput, Switch, Button, StyleSheet } from 'react-native';
import { Task } from '../types/Task';

type Props = {
  initial?: Partial<Task>;
  onSubmit: (data: { title: string; description?: string; done: boolean }) => void;
  submitLabel?: string;
};

export function TaskForm({ initial, onSubmit, submitLabel = 'Salvar' }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [done, setDone] = useState(initial?.done ?? false);

  useEffect(() => {
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setDone(initial?.done ?? false);
  }, [initial]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Descrição (opcional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <View style={styles.row}>
        <Switch value={done} onValueChange={setDone} />
      </View>
      <Button
        title={submitLabel}
        onPress={() => onSubmit({ title: title.trim(), description: description.trim() || undefined, done })}
        disabled={title.trim().length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: 
  { 
    gap: 12 
},
  input: 
  { 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderColor: '#ddd' 
},
  multiline: 
  { 
    minHeight: 80, 
    textAlignVertical: 'top' 
},
  row: 
  { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
},
});
```

### 5.6 - Criar o App.tsx Principal

Substitua o conteúdo do arquivo `App.tsx` na raiz do projeto:

```typescript
import React, { useState } from 'react';
import { StatusBar, FlatList, View, Text, Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTasks } from './src/hooks/useTasks';
import { Task } from './src/types/Task';
import { TaskItem } from './src/components/TaskItem';
import { TaskForm } from './src/components/TaskForm';

type Screen = 'list' | 'edit';
type EditState = { mode: 'create' } | { mode: 'edit'; task: Task };

export default function App() {
  const { tasks, loading, error, createTask, updateTask, removeTask, clear, stats } = useTasks();
  const [screen, setScreen] = useState<Screen>('list');
  const [editState, setEditState] = useState<EditState>({ mode: 'create' });

  const openCreate = () => {
    setEditState({ mode: 'create' });
    setScreen('edit');
  };

  const openEdit = (task: Task) => {
    setEditState({ mode: 'edit', task });
    setScreen('edit');
  };

  const submit = async (data: { title: string; description?: string; done: boolean }) => {
    if (editState.mode === 'create') {
      await createTask(data);
    } else {
      await updateTask(editState.task.id, data);
    }
    setScreen('list');
  };

  const confirmDelete = (task: Task) => {
    Alert.alert('Excluir', `Confirma excluir "${task.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => removeTask(task.id) },
    ]);
  };

  const toggleDone = (task: Task) => updateTask(task.id, { done: !task.done });

  return (
    <SafeAreaProvider>
      {screen === 'edit' ? (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.header}>
            <Text style={styles.title}>{editState.mode === 'create' ? 'Nova Tarefa' : 'Editar Tarefa'}</Text>
            <Text style={styles.link} onPress={() => setScreen('list')}>Voltar</Text>
          </View>
          <View style={styles.content}>
            <TaskForm
              initial={editState.mode === 'edit' ? editState.task : undefined}
              onSubmit={submit}
              submitLabel="Salvar"
            />
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.header}>
            <Text style={styles.title}>Minhas Tarefas</Text>
            <Text style={styles.link} onPress={openCreate}>+ Nova</Text>
          </View>

          <View style={styles.summary}>
            <Text>Total: {stats.total}</Text>
            <Text>Concluídas: {stats.done}</Text>
            <Text>Pendentes: {stats.pending}</Text>
            <Text style={[styles.link, { marginLeft: 'auto' }]} onPress={clear}>Limpar Tudo</Text>
          </View>

          {loading && <Text style={styles.note}>Carregando...</Text>}
          {error && <Text style={styles.error}>Erro: {error}</Text>}
          {!loading && tasks.length === 0 && <Text style={styles.note}>Nenhuma tarefa. Adicione a primeira.</Text>}

          <FlatList
            data={tasks}
            keyExtractor={t => t.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TaskItem
                task={item}
                onToggleDone={() => toggleDone(item)}
                onEdit={() => openEdit(item)}
                onDelete={() => confirmDelete(item)}
              />
            )}
          />
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: 
  { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: 
  { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16 
  },
  title: 
  { 
    fontSize: 22, 
    fontWeight: '700' 
  },
  link: 
  { 
    color: '#1976d2', 
    fontWeight: '700' 
  },
  summary: 
  { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingHorizontal: 16, 
    paddingBottom: 8 
  },
  content: 
  { 
    padding: 16 
  },
  note: 
  { 
    paddingHorizontal: 16, 
    color: '#666' 
  },
  error: 
  { 
    paddingHorizontal: 16, 
    color: '#d32f2f' 
  },
});
```

### 5.7 - Atualizar o index.ts

O arquivo `index.ts` na raiz deve conter:

```typescript
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
```

### 5.8 - Atualizar package.json

Certifique-se que o `package.json` está correto:

```json
{
  "name": "my-task-app",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "2.2.0",
    "expo": "~54.0.33",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-safe-area-context": "~5.6.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2"
  },
  "private": true
}
```

### 5.9 - Atualizar tsconfig.json

O arquivo `tsconfig.json` deve conter:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

### 5.10 - Atualizar app.json

O arquivo `app.json` deve conter:

```json
{
  "expo": {
    "name": "my-task-app",
    "slug": "my-task-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

---

## ▶️ Passo 6: Executar o Aplicativo

No terminal, execute:

```powershell
npx expo start
```

Ou:

```powershell
npx expo start --tunnel
```

Isso abrirá o Metro Bundler. Você verá um QR Code e opções:

- **Android**: Pressione `a` ou escaneie o QR Code com o Expo Go
- **iOS**: Pressione `i` ou escaneie o QR Code com o Expo Go (apenas Mac)
- **Web**: Pressione `w` para abrir no navegador

---

## 🧪 Passo 7: Testar as Funcionalidades

Após o app carregar no dispositivo/emulador:

1. **Criar tarefa**: Toque em "+ Nova", preencha título e descrição, e salve
2. **Marcar como concluída**: Toque no círculo à esquerda da tarefa
3. **Editar tarefa**: Toque no botão "Editar"
4. **Excluir tarefa**: Toque no botão "Excluir" e confirme
5. **Ver estatísticas**: Observe o resumo no topo (Total, Concluídas, Pendentes)
6. **Limpar tudo**: Toque em "Limpar Tudo" para remover todas as tarefas

---

## 🏗️ Arquitetura do Projeto

### Fluxo de Dados

```text
App.tsx (UI + Navegação)
    ↓
useTasks (Hook personalizado)
    ↓
tasksStorage (Camada de persistência)
    ↓
AsyncStorage (Storage nativo)
```

### Componentes

- **App.tsx**: Componente principal, gerencia navegação entre telas
- **TaskItem.tsx**: Exibe uma tarefa individual na lista
- **TaskForm.tsx**: Formulário para criar/editar tarefas

### Lógica

- **useTasks.ts**: Hook com toda a lógica de CRUD e estado
- **tasksStorage.ts**: Funções de acesso ao AsyncStorage
- **Task.ts**: Definição de tipos TypeScript

---

## 🎯 Conceitos Aprendidos

1. **React Native**: Componentes de UI nativos
2. **TypeScript**: Tipagem estática
3. **React Hooks**: useState, useEffect, useCallback, useMemo
4. **AsyncStorage**: Persistência local de dados
5. **FlatList**: Renderização eficiente de listas
6. **SafeAreaView**: Suporte para notch e áreas seguras
7. **Arquitetura em camadas**: Separação de responsabilidades

---

## 🐛 Solução de Problemas Comuns

### Erro: "Module not found"

```powershell
npm install
npx expo start -c
```

### Expo Go não conecta

- Certifique-se que PC e celular estão na mesma rede Wi-Fi
- Desative VPN temporariamente
- Use o modo Tunnel: `npx expo start --tunnel`

### TypeScript mostra erros

```powershell
# Reinstalar dependências TypeScript
npm install --save-dev @types/react typescript
```

### App não atualiza

```powershell
# Limpar cache e reiniciar
npx expo start -c
```

---

## 📚 Recursos Adicionais

- **Documentação Expo**: <https://docs.expo.dev/>
- **React Native Docs**: <https://reactnative.dev/docs/getting-started>
- **TypeScript Handbook**: <https://www.typescriptlang.org/docs/>
- **AsyncStorage Docs**: <https://react-native-async-storage.github.io/async-storage/>

---

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] Projeto criado com Expo
- [ ] Dependências instaladas
- [ ] Estrutura de pastas criada
- [ ] Todos os arquivos TypeScript criados
- [ ] package.json configurado
- [ ] tsconfig.json configurado
- [ ] app.json configurado
- [ ] App executando sem erros
- [ ] Funcionalidades testadas

---

**Parabéns! 🎉** Você recriou com sucesso o aplicativo de tarefas!

Se encontrar problemas, revise cada passo cuidadosamente e certifique-se de que todos os arquivos foram criados corretamente.
