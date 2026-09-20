import { API_BASE_URL } from '@/utils/request';
import { useEffect } from 'react';

const RANDOM_PIC_URL = `${API_BASE_URL}/115/pic/random`;

export function Pic() {
  useEffect(() => {
    window.location.replace(RANDOM_PIC_URL);
  }, []);

  return null;
}
