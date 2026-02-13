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