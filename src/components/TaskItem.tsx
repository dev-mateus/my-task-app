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