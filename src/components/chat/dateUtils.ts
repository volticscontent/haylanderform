import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Message } from './types';

export function formatMessageDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  
  if (isToday(date)) {
    return 'Hoje';
  }
  
  if (isYesterday(date)) {
    return 'Ontem';
  }
  
  // Se for desta semana, mostrar dia da semana
  const diff = Date.now() - date.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  if (diff < oneWeek) {
    return format(date, 'eeee', { locale: ptBR });
  }
  
  // Caso contrário, data completa
  return format(date, 'dd/MM/yyyy');
}

export function formatChatListDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  
  if (isYesterday(date)) {
    return 'Ontem';
  }
  
  const diff = Date.now() - date.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  if (diff < oneWeek) {
    return format(date, 'eee', { locale: ptBR }); // Dia da semana abreviado
  }
  
  return format(date, 'dd/MM/yyyy');
}

export function shouldGroupMessages(current: Message | undefined, previous: Message | undefined): boolean {
  if (!current || !previous) return false;
  
  // Mesmo remetente
  if (current.fromMe !== previous.fromMe) return false;
  
  // Se não for 'fromMe', verificar se é o mesmo ID de contato (caso tenhamos grupos no futuro)
  // Por enquanto assumimos chat 1:1, então se !fromMe e !prev.fromMe, é a mesma pessoa.
  
  // Intervalo de tempo menor que 2 minutos
  const timeDiff = current.timestamp - previous.timestamp;
  return timeDiff < 120; // 120 segundos
}
