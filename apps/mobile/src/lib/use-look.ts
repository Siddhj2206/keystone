import { useStore } from "./store";
import { lookOf } from "./looks";
export function useLook() {
  const { data, setLook } = useStore();
  return { look: lookOf(data.look ?? process.env.EXPO_PUBLIC_LOOK), setLook };
}
