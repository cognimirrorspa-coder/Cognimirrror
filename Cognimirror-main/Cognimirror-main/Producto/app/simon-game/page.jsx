'use client';
import { useRouter } from 'next/navigation';
import MemoryGameView from '../../components/MemoryGameView';

export default function SimonGamePage() {
  const router = useRouter();
  return <MemoryGameView onExit={() => router.push('/dashboard')} />;
}
