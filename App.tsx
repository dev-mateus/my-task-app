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