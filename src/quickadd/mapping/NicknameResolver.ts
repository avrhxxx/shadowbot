// src/quickadd/mapping/NicknameResolver.ts

export async function resolveNickname(nick: string): Promise<string> {
  return nick.trim();
}