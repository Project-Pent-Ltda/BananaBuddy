import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import {
  Apple,
  Chrome,
  Lock,
  Plus,
  Flame,
  Users,
  Trophy,
  Zap,
  Heart,
  ChevronRight,
  Search,
  Check,
  LogOut,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  fetchMyBananeiras,
  createBananeira,
  joinBananeira,
  fetchBananeiraMembers,
  sendPoke,
  fetchUnseenPokes,
  markPokesSeen,
  redeemPendingPokes,
  fetchUnseenRescues,
  markRescuesSeen,
  registerResurrection,
  fetchUnseenResurrections,
  markResurrectionsSeen,
  sportSessionsTotal,
  topSportOf,
  type BananeiraOverview,
  type BananeiraMember,
} from "@/lib/bananeiras";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Types ---
type Screen = "splash" | "login" | "health" | "onboarding" | "dashboard" | "customization" | "bananeira-selection" | "bananeira-map" | "achievements";

type Sport = { id: string, name: string, icon: string, target: number, unit: string, rewardSkin: string };

const availableSports: Sport[] = [
  { id: "judo", name: "Judô/Jiu-Jitsu", icon: "🥋", target: 20, unit: "aulas", rewardSkin: "judo" },
  { id: "run", name: "Corrida", icon: "🏃", target: 50, unit: "km", rewardSkin: "run" },
  { id: "musculacao", name: "Musculação", icon: "🏋️", target: 20, unit: "dias", rewardSkin: "boxe" },
  { id: "yoga", name: "Yoga", icon: "🧘", target: 5, unit: "sessões", rewardSkin: "yoga" },
];

// Mudar para false após a apresentação para reativar a lógica de bloqueio
const DEMO_ALL_UNLOCKED = true;

type FreeSkin = { id: string; label: string; frames: number; category: 'free' };
type StoreSkin = { id: string; label: string; frames: number; category: 'store'; price: number };
type AchievementSkin = { id: string; label: string; frames: number; category: 'achievement'; sport: string; target: number };
type SkinDef = FreeSkin | StoreSkin | AchievementSkin;

const SKINS: SkinDef[] = [
  { id: 'base',   label: 'Original',  frames: 1, category: 'free' },
  { id: 'ballet', label: 'Ballet',    frames: 4, category: 'store',       price: 300 },
  { id: 'boxe',   label: 'Boxe',      frames: 4, category: 'achievement', sport: 'musculacao', target: 30 },
  { id: 'cycle',  label: 'Ciclismo',  frames: 4, category: 'store',       price: 600 },
  { id: 'judo',   label: 'Judô',      frames: 4, category: 'achievement', sport: 'judo',       target: 20 },
  { id: 'run',    label: 'Corrida',   frames: 4, category: 'achievement', sport: 'corrida',    target: 50 },
  { id: 'soccer', label: 'Futebol',   frames: 4, category: 'store',       price: 900 },
  { id: 'swim',   label: 'Natação',   frames: 4, category: 'store',       price: 1200 },
  { id: 'yoga',   label: 'Yoga',      frames: 4, category: 'achievement', sport: 'yoga',       target: 15 },
];

function isSkinUnlocked(skin: SkinDef, ctx: { unlockedStoreSkins: string[]; practicedSports: Record<string, number> }): boolean {
  if (DEMO_ALL_UNLOCKED) return true;
  if (skin.category === 'free') return true;
  if (skin.category === 'store') return ctx.unlockedStoreSkins.includes(skin.id);
  return (ctx.practicedSports[skin.sport] ?? 0) >= skin.target;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const diffDays = (a: string, b: string) => Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);

// Estados de decaimento da banana (PRD §4.2) — fatia do GAP #2, usada hoje só no mapa de Bananeiras
type DecayState = "novo" | "saudavel" | "amadurecendo" | "quase-podre" | "podre";

function bananaDecayState(lastActivityDate: string | null, today: string): { state: DecayState; cssClass: string; emoji: string; atRisk: boolean } {
  if (!lastActivityDate) return { state: "novo", cssClass: "", emoji: "", atRisk: false };
  const days = diffDays(lastActivityDate, today);
  if (days <= 1) return { state: "saudavel", cssClass: "", emoji: "", atRisk: false };
  if (days <= 3) return { state: "amadurecendo", cssClass: "saturate-[0.7] sepia-[0.3] brightness-90", emoji: "😐", atRisk: true };
  if (days <= 6) return { state: "quase-podre", cssClass: "saturate-[0.4] sepia-[0.6] grayscale-[0.3] brightness-75", emoji: "😰", atRisk: true };
  return { state: "podre", cssClass: "grayscale brightness-50", emoji: "💀", atRisk: true };
}

// --- Components ---

const BananaIcon = ({ className, mood = "happy", size = "md", skin = "base", animated = true }: { className?: string, mood?: "happy" | "on-fire" | "dead" | "zen", size?: "sm" | "md" | "lg", skin?: string, animated?: boolean }) => {
  const [frame, setFrame] = useState(1);

  useEffect(() => {
    if (skin === "base" || !animated) return;
    const intervalTime = mood === "dead" ? 300 : mood === "on-fire" ? 100 : 600;
    const interval = setInterval(() => {
      setFrame((prev) => (prev % 4) + 1);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [skin, mood, animated]);

  const sizes = {
    sm: "w-12 h-12 text-2xl",
    md: "w-32 h-32 text-5xl",
    lg: "w-48 h-48 text-7xl"
  };

  const imgSrc = skin === "base" ? "/banana.png" : `/banana_${skin}_${frame}.png`;

  return (
    <motion.div
      initial={{ scale: 0.8, rotate: animated ? -5 : 0 }}
      animate={animated ? {
        scale: 1,
        rotate: [ -5, 5, -5 ],
        y: [ 0, -10, 0 ]
      } : { scale: 1, rotate: 0, y: 0 }}
      transition={animated ? {
        rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      } : { duration: 0.2 }}
      className={`relative flex items-center justify-center drop-shadow-2xl ${sizes[size]} ${className}`}
    >
      <img src={imgSrc} alt="Banana Buddy" className="w-full h-full object-contain drop-shadow-xl scale-[1.15]" />
      
      {mood === "on-fire" && (
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute -top-4 text-4xl"
        >
          🔥
        </motion.div>
      )}
    </motion.div>
  );
};

const SplashScreen = ({ onNext }: { onNext: () => void }) => {
  const skins = SKINS.map(s => s.id);
  const [skinIndex, setSkinIndex] = useState(0);

  useEffect(() => {
    const skinTimer = setInterval(() => {
      setSkinIndex((prev) => (prev + 1) % skins.length);
    }, 300);
    const nextTimer = setTimeout(onNext, 4000);
    return () => { clearInterval(skinTimer); clearTimeout(nextTimer); };
  }, [onNext]);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden bg-black">
      <div className="z-10 flex flex-col items-center gap-8">
        <div className="w-32 h-32">
          <BananaIcon skin={skins[skinIndex]} mood="happy" />
        </div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="font-display text-4xl font-extrabold tracking-tighter text-white text-center"
        >
          Banana Buddy
        </motion.h1>
      </div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-16 flex flex-col items-center text-center px-8 w-full"
      >
        <p className="font-sans text-xs italic font-bold mb-3 text-white/90">
          "A saúde é um estado de espírito,<br />que se reflete no corpo."
        </p>
        <p className="font-sans text-[10px] uppercase tracking-widest text-white/50">
          Cuidar da saúde é um ato de amor próprio.
        </p>
      </motion.div>
    </div>
  );
};

const LoginScreen = ({ onSuccess }: { onSuccess: () => void }) => {
  const [tab, setTab] = useState<'entrar' | 'cadastrar'>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError('Email ou senha incorretos.');
    else onSuccess();
  };

  const handleRegister = async () => {
    setError('');
    if (password !== confirmPassword) { setError('As senhas não conferem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    setLoading(false);
    if (error) { console.error('signUp error:', error); setError(error.message || JSON.stringify(error)); return; }
    if (!data.session) { setError('Verifique seu email para confirmar o cadastro.'); return; }
    onSuccess();
  };

  return (
    <div className="relative h-full w-full flex flex-col px-8 py-10 bg-black overflow-y-auto">
      <div className="flex flex-col items-center gap-1 mb-8 mt-8">
        <img src="/banana_yoga_4.png" style={{ width: 48, height: 48, imageRendering: 'pixelated', objectFit: 'contain' }} />
        <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '20px' }} className="text-white whitespace-nowrap">Banana Buddy</span>
      </div>

      <div className="flex bg-white/5 rounded-full p-1 mb-6">
        <button
          onClick={() => { setTab('entrar'); setError(''); }}
          className={`flex-1 rounded-full py-2 text-xs font-bold uppercase tracking-wider transition-colors ${tab === 'entrar' ? 'bg-banana text-black' : 'text-white/60 hover:text-white'}`}
        >
          Entrar
        </button>
        <button
          onClick={() => { setTab('cadastrar'); setError(''); }}
          className={`flex-1 rounded-full py-2 text-xs font-bold uppercase tracking-wider transition-colors ${tab === 'cadastrar' ? 'bg-banana text-black' : 'text-white/60 hover:text-white'}`}
        >
          Cadastrar
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {tab === 'entrar' ? (
          <>
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white px-5" />
            <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white px-5" />
            {error && <p className="text-red-400 text-xs text-center px-2">{error}</p>}
            <Button onClick={handleLogin} disabled={loading || !email || !password}
              className="h-12 rounded-3xl bg-banana text-black hover:bg-banana-dark font-bold disabled:opacity-50 mt-1">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-white/30 uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <Button className="h-12 rounded-3xl bg-white text-black hover:bg-white/90 font-bold flex items-center justify-center gap-3">
              <Apple className="w-5 h-5 fill-current" /> Continuar com Apple
            </Button>
            <Button className="h-12 rounded-3xl bg-white text-black hover:bg-white/90 font-bold flex items-center justify-center gap-3">
              <Chrome className="w-5 h-5 text-blue-500" /> Continuar com Google
            </Button>
          </>
        ) : (
          <>
            <Input placeholder="Nome" value={name} onChange={e => setName(e.target.value)}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white px-5" />
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white px-5" />
            <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white px-5" />
            <Input type="password" placeholder="Confirmar senha" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white px-5" />
            {error && <p className="text-red-400 text-xs text-center px-2">{error}</p>}
            <Button onClick={handleRegister} disabled={loading || !email || !password || !confirmPassword}
              className="h-12 rounded-3xl bg-banana text-black hover:bg-banana-dark font-bold disabled:opacity-50 mt-1">
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-[10px] text-white/40 uppercase tracking-widest">
        Ao continuar, você concorda com nossos Termos e Privacidade.
      </p>
    </div>
  );
};

const HealthIntegrationScreen = ({ onNext }: { onNext: () => void }) => {
  const [appleHealth, setAppleHealth] = useState(true);
  const [googleFit, setGoogleFit] = useState(false);

  return (
    <div className="relative h-full w-full flex flex-col px-8 py-16 bg-black overflow-hidden">
      <h2 className="font-display text-2xl font-bold text-center mb-8">Conecte sua Saúde</h2>
      <p className="text-white/60 text-center mb-12 px-4">
        Sincronize seus dados para que sua banana reflita seu esforço real em tempo real.
      </p>
      <div className="flex flex-col gap-6">
        <Card className="p-6 rounded-[24px] bg-[#111] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Heart className="text-red-500 w-6 h-6 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white">Apple Health</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${appleHealth ? "text-green-400" : "text-white/30"}`}>
                {appleHealth ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>
          <Switch checked={appleHealth} onCheckedChange={setAppleHealth} className="data-checked:bg-green-500" />
        </Card>
        <Card className="p-6 rounded-[24px] bg-[#111] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Chrome className="text-blue-500 w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white">Google Fit</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${googleFit ? "text-green-400" : "text-white/30"}`}>
                {googleFit ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>
          <Switch checked={googleFit} onCheckedChange={setGoogleFit} className="data-checked:bg-green-500" />
        </Card>
      </div>
      <div className="mt-12 flex items-center justify-center gap-2 text-white/40">
        <Lock className="w-4 h-4" />
        <span className="text-xs">Sincronização de dados segura e criptografada.</span>
      </div>
      <Button onClick={onNext} className="mt-auto h-14 rounded-3xl bg-banana text-black hover:bg-banana-dark font-bold text-lg">
        Continuar
      </Button>
    </div>
  );
};

const OnboardingScreen = ({ onNext, buddyName, setBuddyName, practicedSports, toggleSport }: { 
  onNext: () => void, buddyName: string, setBuddyName: (n: string) => void, 
  practicedSports: Record<string, number>, toggleSport: (id: string) => void 
}) => {
  return (
    <div className="relative h-full w-full flex flex-col px-8 py-16 bg-black overflow-hidden">
      <div className="mb-8">
        <label className="block text-white/40 text-xs uppercase tracking-widest mb-3 ml-2">Dê um nome ao seu Buddy</label>
        <Input 
          value={buddyName}
          onChange={(e) => setBuddyName(e.target.value)}
          placeholder="Ex: Bananinha" 
          className="h-14 rounded-[24px] bg-white/5 border-white/10 text-white text-lg px-6 focus:ring-banana" 
        />
      </div>
      <div className="flex-1">
        <label className="block text-white/40 text-xs uppercase tracking-widest mb-4 ml-2">O que você pratica?</label>
        <p className="text-xs text-white/50 mb-6 ml-2">Escolha seus esportes para desbloquear missões exclusivas.</p>
        <div className="grid grid-cols-2 gap-4">
          {availableSports.map((m) => {
            const isSelected = practicedSports[m.id] !== undefined;
            return (
              <motion.div
                key={m.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSport(m.id)}
                className={`rounded-[24px] p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors border ${isSelected ? "bg-banana/10 border-banana text-banana" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
              >
                <span className="text-3xl">{m.icon}</span>
                <span className="font-bold text-sm text-center">{m.name}</span>
                {isSelected && <Check className="w-4 h-4 absolute top-3 right-3 text-banana" />}
              </motion.div>
            )
          })}
        </div>
      </div>
      <Button 
        onClick={() => {
          if (!buddyName) setBuddyName("Bananinha");
          onNext();
        }} 
        className="mt-8 h-14 rounded-3xl bg-banana text-black hover:bg-banana-dark font-bold text-lg"
      >
        Começar Jornada
      </Button>
    </div>
  );
};

type AppNotification =
  | { kind: "poke"; fromName: string }
  | { kind: "rescue"; rescuedName: string; bonus: number }
  | { kind: "resurrection-self"; bonus: number }
  | { kind: "resurrection-witness"; fromName: string; bananeiraNome: string };

const NotificationModal = ({ notification, onDismiss, onTrainNow }: {
  notification: AppNotification, onDismiss: () => void, onTrainNow: () => void
}) => {
  const n = notification;

  const config = (() => {
    if (n.kind === "poke") return {
      bananaMood: "happy" as const,
      bananaClass: "saturate-[0.4] sepia-[0.6] grayscale-[0.3] brightness-75 mx-auto",
      title: `${n.fromName} te cutucou! 👈`,
      subtitle: "Sua banana tá apodrecendo 🍌 — treina pra reverter!",
      primaryBtn: { label: "Treinar agora", action: onTrainNow },
      dismissLabel: "Depois",
    };
    if (n.kind === "rescue") return {
      bananaMood: "happy" as const,
      bananaClass: "mx-auto",
      title: `Você salvou a banana do ${n.rescuedName}! 🦸`,
      subtitle: `+${n.bonus} raios por cuidar dos amigos.`,
      primaryBtn: null,
      dismissLabel: "Boa!",
    };
    if (n.kind === "resurrection-self") return {
      bananaMood: "on-fire" as const,
      bananaClass: "mx-auto",
      title: "Sua banana voltou dos mortos! 🍌🔥",
      subtitle: `+${n.bonus} raios de bônus de sobrevivente. Não suma mais!`,
      primaryBtn: null,
      dismissLabel: "Voltei!",
    };
    return {
      bananaMood: "happy" as const,
      bananaClass: "mx-auto",
      title: `${n.fromName} ressuscitou! 🍌🔥`,
      subtitle: `${n.fromName} voltou dos mortos na ${n.bananeiraNome}. Dê boas-vindas!`,
      primaryBtn: null,
      dismissLabel: "🎉",
    };
  })();

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl"
      >
        <BananaIcon mood={config.bananaMood} size="md" skin="base" className={config.bananaClass} animated={n.kind === "resurrection-self"} />
        <h3 className="font-display text-lg font-bold text-white mt-3">{config.title}</h3>
        <p className="text-xs text-white/60 mt-1">{config.subtitle}</p>
        <div className="flex flex-col gap-2 mt-5">
          {config.primaryBtn && (
            <Button onClick={config.primaryBtn.action} className="h-11 rounded-2xl bg-banana text-black font-bold text-sm">
              {config.primaryBtn.label}
            </Button>
          )}
          <Button onClick={onDismiss} variant="ghost" className="h-11 rounded-2xl text-white/60 hover:text-white text-sm">
            {config.dismissLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const DashboardScreen = ({ onCustomization, onBananeiras, onAchievements, onLogout, buddyName, activeSkin, isOnFire, raios, currentStreak, streakShields, streakBadgeTitle, supportCount, lastActivityDate }: {
  onCustomization: () => void, onBananeiras: () => void, onAchievements: () => void, onLogout: () => void,
  buddyName: string, activeSkin: string, isOnFire: boolean, raios: number,
  currentStreak: number, streakShields: number, streakBadgeTitle: string | null, supportCount: number,
  lastActivityDate: string | null,
}) => {
  const decay = isOnFire ? null : bananaDecayState(lastActivityDate, todayStr());
  const decayText =
    decay?.state === "amadurecendo" ? "Sua banana tá amadurecendo... treina hoje!" :
    decay?.state === "quase-podre"  ? "Sua banana tá quase podre! Corre!" :
    decay?.state === "podre"        ? "SUA BANANA APODRECEU. Ressuscita!" : null;
  return (
    <div className="relative h-full w-full flex flex-col bg-black overflow-hidden">
      <div className="relative z-10 flex-1 flex flex-col p-6 pt-12">
        <div className="flex justify-end mb-1">
          <Button variant="ghost" size="icon" onClick={onLogout} className="w-8 h-8 rounded-full text-white/30 hover:text-white hover:bg-white/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">{buddyName}</h1>
          <p className="text-xs text-banana uppercase tracking-widest font-bold">Nível 12 • Pro Fitness</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs font-bold text-white/80 bg-white/5 px-2 py-1 rounded-full">
              🔥 {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
            </span>
            {streakShields > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-white/80 bg-white/5 px-2 py-1 rounded-full">
                🛡️ {streakShields}
              </span>
            )}
            {supportCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-white/80 bg-white/5 px-2 py-1 rounded-full">
                🤝 Apoiador ×{supportCount}
              </span>
            )}
          </div>
          {streakBadgeTitle && (
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">🏅 {streakBadgeTitle}</p>
          )}
          {decayText && (
            <p className={`text-[11px] font-bold mt-2 ${decay?.state === "podre" ? "text-red-400 uppercase tracking-wide" : "text-orange-400"}`}>
              {decayText}
            </p>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center relative px-2 mb-6 cursor-pointer group" onClick={onCustomization}>
          <div className="relative border border-white/20 rounded-3xl w-full max-w-xs aspect-square flex items-center justify-center bg-[#0a0a0a]">
            {isOnFire && <div className="absolute inset-0 border-2 border-red-500 rounded-3xl animate-pulse" />}
            {decay?.atRisk && <div className="absolute inset-0 border-2 border-white/20 rounded-3xl animate-pulse" />}
            <div className="absolute w-40 h-40 bg-banana/5 rounded-full blur-2xl group-hover:bg-banana/10 transition-all duration-500" />
            <BananaIcon mood={isOnFire ? "on-fire" : decay?.state === "podre" ? "dead" : "happy"} size="lg" skin={activeSkin} className={`group-hover:scale-105 transition-transform ${decay?.cssClass ?? ""}`} />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 text-[10px] font-bold text-white/60 uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/10 group-hover:text-white transition-colors"
            >
              Customizar
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <Button onClick={onBananeiras} className="h-14 rounded-3xl bg-banana text-black hover:bg-banana-dark font-bold text-lg transition-transform active:scale-95 w-full flex items-center justify-center gap-2">
            <Users className="w-5 h-5" /> Minhas Bananeiras
          </Button>
          <Button onClick={onAchievements} className="h-14 rounded-3xl bg-white/10 text-white hover:bg-white/20 font-bold text-lg transition-transform active:scale-95 w-full flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5" /> Conquistas e Metas
          </Button>
        </div>
      </div>
    </div>
  );
};

const AchievementsScreen = ({ onBack, practicedSports, toggleSport, updateProgress, isOnFire, setIsOnFire, raios }: { 
  onBack: () => void, practicedSports: Record<string, number>, toggleSport: (id: string, forceDelete?: boolean) => void, 
  updateProgress: (id: string, amt: number) => void, isOnFire: boolean, setIsOnFire: (val: boolean) => void, raios: number 
}) => {
  const [goalText, setGoalText] = useState("");
  const [deletingSport, setDeletingSport] = useState<string | null>(null);

  const handleGoalSubmit = () => {
    if (goalText.trim().length > 0) {
      setIsOnFire(true);
      setGoalText("");
    }
  };

  const handleRemoveClick = (sportId: string) => {
    const prog = practicedSports[sportId];
    if (prog > 0) {
      setDeletingSport(sportId); // Require confirmation
    } else {
      toggleSport(sportId, true); // Delete directly
    }
  };

  const handleConfirmDelete = (sportId: string) => {
    toggleSport(sportId, true);
    setDeletingSport(null);
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-black overflow-hidden px-6 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white" onClick={onBack}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h2 className="font-display text-2xl font-bold">Conquistas</h2>
        </div>
        <div className="flex items-center gap-1 bg-banana/10 text-banana px-3 py-1 rounded-full font-bold">
          <Zap className="w-4 h-4" /> {raios}
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="flex flex-col gap-6 pb-20">
          
          {/* Suas Missões (Esportes Praticados) */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2 mb-3">Suas Missões Ativas</h3>
            <div className="flex flex-col gap-3">
              {Object.keys(practicedSports).length === 0 && (
                <p className="text-xs text-white/30 italic ml-2">Nenhum esporte ativo no momento.</p>
              )}
              {Object.entries(practicedSports).map(([id, prog]) => {
                const sport = availableSports.find(s => s.id === id);
                if (!sport) return null;
                const isComplete = prog >= sport.target;
                const isConfirming = deletingSport === id;
                return (
                  <div key={id} className="bg-[#111] border border-white/10 rounded-[20px] p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl">{sport.icon}</div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{sport.name}</div>
                        <div className="text-[10px] text-banana uppercase tracking-widest mt-1">
                          {isComplete ? "Concluído" : `${prog} / ${sport.target} ${sport.unit}`}
                        </div>
                      </div>
                      {isComplete ? <Check className="text-green-400 w-5 h-5" /> : null}
                    </div>
                    
                    {!isComplete && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" onClick={() => updateProgress(id, 1)} className="flex-1 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3"/> 1 Progresso <span className="text-banana ml-1 flex items-center"><Zap className="w-3 h-3"/> 20</span>
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => isConfirming ? handleConfirmDelete(id) : handleRemoveClick(id)} 
                          className={`flex-1 h-8 rounded-lg text-xs font-bold transition-colors ${isConfirming ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/5 hover:bg-white/10 text-white/60"}`}
                        >
                          {isConfirming ? "Confirmar Exclusão" : "Excluir"}
                        </Button>
                      </div>
                    )}
                    {isConfirming && <p className="text-[9px] text-red-400 text-center mt-1">Conquista em andamento! Você perderá os pontos se excluir.</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Adicionar Esportes */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2 mb-3">Mais Esportes</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
              {availableSports.filter(s => practicedSports[s.id] === undefined).map(sport => (
                <div key={sport.id} className="min-w-[120px] bg-[#111] border border-white/10 rounded-[20px] p-4 flex flex-col items-center gap-2 snap-start">
                  <span className="text-2xl">{sport.icon}</span>
                  <span className="text-xs font-bold text-center h-8">{sport.name}</span>
                  <Button size="sm" onClick={() => toggleSport(sport.id)} className="w-full h-7 rounded-md bg-banana/10 hover:bg-banana/20 text-banana text-[10px] font-bold mt-auto">
                    Praticar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Setar Metas */}
          <div className="mt-4 bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-[24px] p-5">
            <h3 className="flex items-center gap-2 font-display font-bold text-lg text-white mb-2">
              <Flame className="w-5 h-5 text-red-500" /> Setar Meta Pessoal
            </h3>
            <p className="text-xs text-white/60 mb-4">
              Crie uma meta exclusiva para hoje. Ao iniciar, sua banana ficará com o status <strong className="text-red-400">On Fire</strong>!
            </p>
            <div className="flex gap-2">
              <Input 
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="Ex: Beber 3L de água" 
                className="h-12 rounded-xl bg-black/50 border-white/10 text-sm focus:ring-red-500"
              />
              <Button onClick={handleGoalSubmit} disabled={isOnFire || goalText.trim() === ""} className="h-12 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold disabled:opacity-50">
                Iniciar
              </Button>
            </div>
            {isOnFire && <p className="text-[10px] text-red-400 mt-3 font-bold uppercase tracking-widest text-center">Modo On Fire Ativado 🔥</p>}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
};

const CustomizationScreen = ({
  onBack, activeSkin, setActiveSkin, practicedSports, raios, setRaios, unlockedStoreSkins, setUnlockedStoreSkins
}: {
  onBack: () => void, activeSkin: string, setActiveSkin: (s: string) => void, practicedSports: Record<string, number>,
  raios: number, setRaios: (v: number | ((prev: number) => number)) => void,
  unlockedStoreSkins: string[], setUnlockedStoreSkins: (v: string[] | ((prev: string[]) => string[])) => void
}) => {
  return (
    <div className="relative h-full w-full flex flex-col bg-black overflow-hidden px-6 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white" onClick={onBack}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h2 className="font-display text-2xl font-bold">Estilo</h2>
        </div>
        <div className="flex items-center gap-1 bg-banana/10 text-banana px-3 py-1 rounded-full font-bold">
          <Zap className="w-4 h-4" /> {raios}
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="grid grid-cols-3 gap-3 pb-10">
          {SKINS.map((skin, i) => {
            const unlocked = isSkinUnlocked(skin, { unlockedStoreSkins, practicedSports });
            const isActive = activeSkin === skin.id;

            const handlePress = () => {
              if (unlocked) {
                setActiveSkin(skin.id);
                return;
              }
              if (skin.category === 'store') {
                if (raios >= skin.price) {
                  setRaios(r => r - skin.price);
                  setUnlockedStoreSkins(prev => [...prev, skin.id]);
                  setActiveSkin(skin.id);
                }
              }
            };

            const badgeLabel = isActive
              ? 'Equipada'
              : !unlocked && skin.category === 'store'
                ? `⚡ ${skin.price}`
                : !unlocked
                  ? '🔒'
                  : 'Usar';

            return (
              <motion.div
                key={skin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={handlePress}
                className={`rounded-[20px] p-3 flex flex-col items-center gap-1 cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-banana/10 border-banana'
                    : unlocked
                      ? 'bg-[#111] border-white/10 hover:border-white/30'
                      : 'bg-[#0a0a0a] border-white/5 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 flex items-center justify-center ${!unlocked ? 'grayscale' : ''}`}>
                  <BananaIcon skin={skin.id} size="sm" mood="happy" />
                </div>
                <span className="text-[10px] font-bold text-center leading-tight mt-1">{skin.label}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                  isActive ? 'bg-banana text-black' : 'bg-white/10 text-white/60'
                }`}>
                  {badgeLabel}
                </span>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

const BananeiraSelectionScreen = ({ onBack, onSelect }: { onBack: () => void, onSelect: (id: string, name: string, founderId: string) => void }) => {
  const [groups, setGroups] = useState<BananeiraOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    fetchMyBananeiras().then(setGroups).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleJoin = async () => {
    setError("");
    if (!joinCode.trim()) return;
    try {
      const id = await joinBananeira(joinCode.trim());
      const list = await fetchMyBananeiras();
      setGroups(list);
      const found = list.find((g) => g.id === id);
      onSelect(id, found?.name ?? "Bananeira", found?.founder_id ?? "");
    } catch (e: any) {
      setError(e.message || "Bananeira não encontrada");
    }
  };

  const handleCreate = async () => {
    setError("");
    if (!newName.trim()) return;
    try {
      const { id, code } = await createBananeira(newName.trim());
      setCreatedCode(code);
      refresh();
    } catch (e: any) {
      setError(e.message || "Erro ao criar Bananeira");
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-black overflow-hidden px-6 pt-12 pb-6">
      <div className="flex items-center mb-8 gap-4">
        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white" onClick={onBack}>
          <ChevronRight className="w-5 h-5 rotate-180" />
        </Button>
        <h2 className="font-display text-2xl font-bold">Bananeiras</h2>
      </div>

      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Entrar com código..."
            className="h-12 rounded-[20px] bg-[#111] border-white/10 text-white pl-12 focus:ring-banana uppercase"
          />
        </div>
        <Button className="h-12 rounded-[20px] bg-banana text-black font-bold px-4" onClick={handleJoin}>
          Entrar
        </Button>
      </div>
      {error && <div className="text-xs text-red-400 font-semibold mb-4 ml-2">{error}</div>}

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="flex flex-col gap-4 pb-20">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">Suas Bananeiras</h3>

          {loading && <div className="text-white/40 text-sm ml-2">Carregando...</div>}
          {!loading && groups.length === 0 && (
            <div className="text-white/40 text-sm ml-2">Você ainda não está em nenhuma Bananeira.</div>
          )}

          {groups.map((g, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={g.id} onClick={() => onSelect(g.id, g.name, g.founder_id)} className="bg-[#111] border border-white/10 rounded-[24px] p-5 cursor-pointer hover:border-banana/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-banana/5 rounded-bl-full -z-10 group-hover:bg-banana/10 transition-colors" />
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg">{g.name}</span>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-banana group-hover:translate-x-1 transition-all" />
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-white/60">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {g.member_count}</span>
                <span className="flex items-center gap-1 text-white/40">código: {g.code}</span>
              </div>
            </motion.div>
          ))}

          {createdCode && (
            <div className="bg-banana/10 border border-banana/40 rounded-[20px] p-4 text-center">
              <div className="text-xs text-white/60 mb-1">Bananeira criada! Compartilhe o código:</div>
              <div className="text-2xl font-display font-bold text-banana tracking-widest">{createdCode}</div>
            </div>
          )}

          {creating ? (
            <div className="flex flex-col gap-2 mt-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da Bananeira"
                className="h-12 rounded-[20px] bg-[#111] border-white/10 text-white"
              />
              <Button className="h-12 rounded-3xl bg-banana text-black font-bold" onClick={handleCreate}>
                Confirmar
              </Button>
            </div>
          ) : (
            <Button onClick={() => setCreating(true)} className="mt-4 h-14 rounded-3xl bg-white/5 text-white border border-white/10 hover:bg-white/10 font-bold border-dashed w-full">
              <Plus className="w-5 h-5 mr-2" /> Criar Bananeira
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

type MapBanana = BananeiraMember & { x: number; y: number };

const BananeiraMapScreen = ({
  onBack, bananeiraId, bananeiraName, founderId, currentUserId, currentUserName, currentUserSkin, currentUserIsOnFire, currentUserScore, currentUserTopSport, currentUserStreak, currentUserStreakShields, currentUserLastActivity,
  practicedSports, updateProgress
}: {
  onBack: () => void, bananeiraId: string, bananeiraName: string, founderId: string, currentUserId: string,
  currentUserName: string, currentUserSkin: string, currentUserIsOnFire: boolean, currentUserScore: number, currentUserTopSport: string | null, currentUserStreak: number, currentUserStreakShields: number, currentUserLastActivity: string | null,
  practicedSports: Record<string, number>, updateProgress: (id: string, amt: number) => void
}) => {
  const [selectedBanana, setSelectedBanana] = useState<MapBanana | null>(null);
  const [members, setMembers] = useState<BananeiraMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pokeStatus, setPokeStatus] = useState<string>("");
  const [showRegister, setShowRegister] = useState(false);
  const [showRanking, setShowRanking] = useState(true);
  const positionFor = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    return {
      x: 20 + (hash % 6000) / 100,
      y: 20 + (Math.floor(hash / 6000) % 5000) / 100,
    };
  };

  const refresh = () => {
    setLoading(true);
    fetchBananeiraMembers(bananeiraId).then(setMembers).catch((e) => console.error('fetchBananeiraMembers failed:', e)).finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [bananeiraId]);

  const liveMembers: BananeiraMember[] = members
    .map((m) =>
      m.userId === currentUserId
        ? { ...m, name: currentUserName, skin: currentUserSkin, isOnFire: currentUserIsOnFire, score: currentUserScore, topSport: currentUserTopSport, streak: currentUserStreak, shields: currentUserStreakShields, lastActivityDate: currentUserLastActivity }
        : m
    )
    .sort((a, b) => b.score - a.score);
  const mapBananas: MapBanana[] = liveMembers.map((m) => ({ ...m, ...positionFor(m.userId) }));
  const leaderId = liveMembers.length > 0 && liveMembers[0].score > 0 ? liveMembers[0].userId : null;
  const medalFor = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);
  const rankRowStyle = (i: number) =>
    i === 0 ? "bg-banana/10 border border-banana/30" :
    i === 1 ? "bg-white/10 border border-white/15" :
    i === 2 ? "bg-orange-700/10 border border-orange-700/20" :
    "bg-white/5";
  const sportIcon = (id: string | null) => availableSports.find((s) => s.id === id)?.icon ?? null;

  const handlePoke = async (member: BananeiraMember) => {
    setPokeStatus("Enviando...");
    try {
      await sendPoke(member.userId, mapBananas.find((m) => m.userId === currentUserId)?.name ?? "Alguém", bananeiraId);
      setPokeStatus("Cutucada enviada! 👈");
    } catch {
      setPokeStatus("Erro ao cutucar");
    }
    setTimeout(() => setPokeStatus(""), 3000);
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      <div className="absolute inset-0 z-0 bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/fitness_perfect_map.png')", imageRendering: 'pixelated' }}
        />
      </div>

      <div className="absolute inset-0 z-10 overflow-hidden">
        {loading && <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Carregando membros...</div>}
        {mapBananas.map((b) => {
          const decay = bananaDecayState(b.lastActivityDate, todayStr());
          return (
            <motion.div
              key={b.userId}
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              onClick={() => setSelectedBanana(b)}
            >
              <div className="relative">
                {b.userId === leaderId && (
                  <div className="absolute -top-[26px] left-1/2 -translate-x-1/2 text-base">👑</div>
                )}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap relative">
                  <span
                    className="text-[9px] font-bold uppercase text-white"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)' }}
                  >
                    {b.name}
                  </span>
                  {decay.atRisk && (
                    <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] leading-none">{decay.emoji}</span>
                  )}
                </div>
                <BananaIcon mood={b.isOnFire ? "on-fire" : "happy"} size="sm" skin={b.skin} className={`transition-all hover:scale-110 ${decay.cssClass}`} animated={false} />
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {selectedBanana && (() => {
            const decay = bananaDecayState(selectedBanana.lastActivityDate, todayStr());
            return (
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="absolute bottom-6 left-6 right-6 z-30">
              <div className="bg-[#111] border border-white/10 rounded-[24px] p-5 shadow-2xl relative overflow-hidden">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 w-8 h-8 rounded-full text-white/40 hover:text-white z-10" onClick={() => setSelectedBanana(null)}>
                  ✕
                </Button>
                <div className="flex gap-4 items-center relative z-10">
                  <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-2xl">
                    <BananaIcon mood={selectedBanana.isOnFire ? "on-fire" : "happy"} size="sm" skin={selectedBanana.skin} className={decay.cssClass} animated={false} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold text-white">
                      {selectedBanana.name} {selectedBanana.userId === currentUserId && "(Você)"} {selectedBanana.userId === founderId && <span title="Fundador">🌱</span>}
                    </h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                       <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white/80">{selectedBanana.score} sessões</span>
                       {selectedBanana.streak > 0 && (
                         <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white/80">
                           🔥 {selectedBanana.streak} {selectedBanana.streak === 1 ? "dia" : "dias"}
                         </span>
                       )}
                       {selectedBanana.shields > 0 && (
                         <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white/80">
                           🛡️ {selectedBanana.shields}
                         </span>
                       )}
                       {selectedBanana.topSport && (
                         <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white/80">
                           {sportIcon(selectedBanana.topSport)} {availableSports.find((s) => s.id === selectedBanana.topSport)?.name}
                         </span>
                       )}
                       {selectedBanana.isOnFire && <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white/80 flex items-center"><Flame className="w-3 h-3 mr-1 text-red-500" /> On Fire</span>}
                       {decay.atRisk && (
                         <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white/80">
                           {decay.emoji} Banana em risco
                         </span>
                       )}
                    </div>
                    {selectedBanana.userId !== currentUserId && (
                      <Button className="mt-3 h-9 rounded-xl bg-banana text-black font-bold text-xs px-4" onClick={() => handlePoke(selectedBanana)}>
                        {decay.atRisk ? "🍌 Cutucar pra salvar!" : "Cutucar 👈"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })()}
        </AnimatePresence>

        <AnimatePresence>
          {showRegister && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-6 left-6 right-6 z-30">
              <div className="bg-[#111] border border-white/10 rounded-[24px] p-5 shadow-2xl relative overflow-hidden max-h-[60vh] overflow-y-auto">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 w-8 h-8 rounded-full text-white/40 hover:text-white z-10" onClick={() => setShowRegister(false)}>
                  ✕
                </Button>
                <h3 className="font-display text-lg font-bold text-white mb-3">Registrar treino</h3>
                {Object.keys(practicedSports).length === 0 && (
                  <p className="text-xs text-white/30 italic">Nenhum esporte ativo no momento.</p>
                )}
                <div className="flex flex-col gap-2">
                  {Object.entries(practicedSports).map(([id, prog]) => {
                    const sport = availableSports.find((s) => s.id === id);
                    if (!sport) return null;
                    const isComplete = prog >= sport.target;
                    return (
                      <div key={id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{sport.icon}</span>
                          <div>
                            <div className="text-sm font-bold text-white">{sport.name}</div>
                            <div className="text-[10px] text-banana uppercase tracking-widest">
                              {isComplete ? "Concluído" : `${prog} / ${sport.target} ${sport.unit}`}
                            </div>
                          </div>
                        </div>
                        {!isComplete && (
                          <Button size="sm" onClick={() => updateProgress(id, 1)} className="h-8 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1">
                            <Plus className="w-3 h-3" /> 1 sessão
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col">
      <div className="px-6 pt-12 pb-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white" onClick={onBack}>
          <ChevronRight className="w-5 h-5 rotate-180" />
        </Button>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[2px] text-banana font-bold">Mapa Ativo</div>
          <div className="font-display font-bold text-white">{bananeiraName}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white" onClick={() => setShowRegister(true)}>
            <Plus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white" onClick={refresh}>
            <Zap className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="relative z-20 px-6 pb-2">
        {showRanking ? (
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2 flex items-center justify-between gap-2">
              <span>Ranking (sessões)</span>
              <span className="flex items-center gap-2">
                {liveMembers.length} {liveMembers.length === 1 ? "membro" : "membros"}
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-5 h-5 rounded-full text-white/60 hover:text-white"
                  onClick={() => setShowRanking((v: boolean) => !v)}
                >
                  <EyeOff className="w-3 h-3" />
                </Button>
              </span>
            </h4>
            <div className="flex flex-col gap-1">
              {liveMembers.map((m, i) => (
                <div key={m.userId} className={`flex items-center justify-between text-xs rounded-lg px-3 py-1.5 ${rankRowStyle(i)}`}>
                  <span className="font-bold text-white flex items-center gap-1">
                    {medalFor(i) ?? `#${i + 1}`} {m.userId === leaderId && "👑"} {sportIcon(m.topSport)} {m.name} {m.userId === currentUserId && "(Você)"} {m.userId === founderId && <span title="Fundador">🌱</span>}
                  </span>
                  <span className="text-banana font-bold">{m.score}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm text-white/60 hover:text-white"
              onClick={() => setShowRanking((v: boolean) => !v)}
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        )}
        {pokeStatus && <div className="text-[10px] text-banana font-bold mt-2 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 inline-block">{pokeStatus}</div>}
      </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [buddyName, setBuddyName] = useState("");
  const [activeSkin, setActiveSkin] = useState<string>("base");
  const [isOnFire, setIsOnFire] = useState(false);
  const [practicedSports, setPracticedSports] = useState<Record<string, number>>({});
  const [raios, setRaios] = useState(0);
  const [unlockedStoreSkins, setUnlockedStoreSkins] = useState<string[]>([]);
  const [currentBananeira, setCurrentBananeira] = useState<{ id: string; name: string; founderId: string } | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [streakShields, setStreakShields] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [supportCount, setSupportCount] = useState(0);
  const [notificationQueue, setNotificationQueue] = useState<AppNotification[]>([]);

  const STREAK_BADGES: { days: number; title: string }[] = [
    { days: 90, title: "Lendário" },
    { days: 30, title: "Inabalável" },
    { days: 14, title: "Aura Dourada" },
    { days: 7, title: "Persistente" },
  ];
  const streakBadge = (longest: number) => STREAK_BADGES.find((b) => longest >= b.days) ?? null;

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) console.error('loadProfile failed:', error);
    if (data) {
      setBuddyName(data.buddy_name ?? '');
      setActiveSkin(data.active_skin ?? 'base');
      setIsOnFire(data.is_on_fire ?? false);
      setPracticedSports(data.practiced_sports ?? {});
      setRaios(data.raios ?? 0);
      setUnlockedStoreSkins(data.unlocked_store_skins ?? []);
      setSupportCount(data.support_count ?? 0);

      let streak = data.current_streak ?? 0;
      let shields = data.streak_shields ?? 0;
      const lastActivity: string | null = data.last_activity_date ?? null;
      if (lastActivity && streak > 0) {
        const gap = diffDays(lastActivity, todayStr());
        if (gap >= 2) {
          if (gap === 2 && shields > 0) {
            shields -= 1;
          } else {
            streak = 0;
          }
        }
      }
      setCurrentStreak(streak);
      setLongestStreak(data.longest_streak ?? 0);
      setStreakShields(shields);
      setLastActivityDate(lastActivity);
      if (streak !== (data.current_streak ?? 0) || shields !== (data.streak_shields ?? 0)) {
        supabase.from('profiles').upsert({ id: userId, current_streak: streak, streak_shields: shields })
          .then(({ error: reconcileError }) => { if (reconcileError) console.error('reconcileStreak save failed:', reconcileError); });
      }

      setProfileLoaded(true);
      if (data.onboarding_done) setCurrentScreen('dashboard');
      else setCurrentScreen('health');
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        await loadProfile(u.id);
      }
      if (event === 'SIGNED_OUT') {
        setProfileLoaded(false);
        setBuddyName('');
        setActiveSkin('base');
        setIsOnFire(false);
        setPracticedSports({});
        setRaios(0);
        setUnlockedStoreSkins([]);
        setCurrentStreak(0);
        setLongestStreak(0);
        setStreakShields(0);
        setLastActivityDate(null);
        setSupportCount(0);
        setNotificationQueue([]);
        setCurrentScreen('login');
      }
      if (event === 'INITIAL_SESSION') setLoadingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const saveProfileNow = (overrides: Partial<{
    practicedSports: Record<string, number>; raios: number;
    currentStreak: number; longestStreak: number; streakShields: number; lastActivityDate: string | null;
  }> = {}) => {
    if (!user) return;
    supabase.from('profiles').upsert({
      id: user.id,
      buddy_name: buddyName,
      active_skin: activeSkin,
      is_on_fire: isOnFire,
      practiced_sports: overrides.practicedSports ?? practicedSports,
      raios: overrides.raios ?? raios,
      unlocked_store_skins: unlockedStoreSkins,
      current_streak: overrides.currentStreak ?? currentStreak,
      longest_streak: overrides.longestStreak ?? longestStreak,
      streak_shields: overrides.streakShields ?? streakShields,
      last_activity_date: overrides.lastActivityDate ?? lastActivityDate,
    }).then(({ error }) => {
      if (error) console.error('saveProfileNow failed:', error);
    });
  };

  useEffect(() => {
    if (!user || !profileLoaded) return;
    const timer = setTimeout(saveProfileNow, 500);
    return () => clearTimeout(timer);
  }, [raios, activeSkin, practicedSports, unlockedStoreSkins, isOnFire, buddyName, currentStreak, longestStreak, streakShields, lastActivityDate]);

  const registerDailyActivity = () => {
    const today = todayStr();
    if (lastActivityDate === today) {
      return { streak: currentStreak, longest: longestStreak, shields: streakShields, lastDate: today };
    }
    const gap = lastActivityDate ? diffDays(lastActivityDate, today) : null;
    const nextStreak = gap === 1 ? currentStreak + 1 : 1;
    const nextLongest = Math.max(longestStreak, nextStreak);
    const nextShields = nextStreak === 7 ? streakShields + 1 : streakShields;
    setCurrentStreak(nextStreak);
    setLongestStreak(nextLongest);
    setStreakShields(nextShields);
    setLastActivityDate(today);
    return { streak: nextStreak, longest: nextLongest, shields: nextShields, lastDate: today };
  };

  useEffect(() => {
    if (!user || currentScreen !== 'dashboard') return;
    (async () => {
      try {
        const pokes = await fetchUnseenPokes();
        if (pokes.length > 0) {
          setNotificationQueue((prev) => [...prev, ...pokes.map((p) => ({ kind: "poke" as const, fromName: p.fromName }))]);
          await markPokesSeen(pokes.map((p) => p.id));
        }
      } catch {
        // silencioso — checagem best-effort
      }
      try {
        const rescues = await fetchUnseenRescues();
        if (rescues.length > 0) {
          const totalBonus = rescues.reduce((sum, r) => sum + r.bonus, 0);
          setNotificationQueue((prev) => [...prev, ...rescues.map((r) => ({ kind: "rescue" as const, rescuedName: r.rescuedName, bonus: r.bonus }))]);
          setSupportCount((c) => c + rescues.length);
          setRaios((r) => r + totalBonus);
          await markRescuesSeen(rescues.map((r) => r.id));
        }
      } catch {
        // silencioso — checagem best-effort
      }
      try {
        const resurrections = await fetchUnseenResurrections();
        if (resurrections.length > 0) {
          setNotificationQueue((prev) => [...prev, ...resurrections.map((r) => ({ kind: "resurrection-witness" as const, fromName: r.fromName, bananeiraNome: r.bananeiraNome }))]);
          await markResurrectionsSeen(resurrections.map((r) => r.id));
        }
      } catch {
        // silencioso — checagem best-effort
      }
    })();
  }, [user, currentScreen]);

  const dismissNotification = () => setNotificationQueue((prev) => prev.slice(1));

  const toggleSport = (id: string, forceDelete: boolean = false) => {
    const next = { ...practicedSports };
    if (next[id] !== undefined || forceDelete) {
      delete next[id];
    } else {
      next[id] = 0;
    }
    setPracticedSports(next);
    saveProfileNow({ practicedSports: next });
  };

  const updateProgress = (id: string, amt: number) => {
    if (practicedSports[id] === undefined) return;
    const wasRotten = bananaDecayState(lastActivityDate, todayStr()).state === "podre";
    const ressurrectionBonus = wasRotten ? 50 : 0;
    const nextSports = { ...practicedSports, [id]: practicedSports[id] + amt };
    const nextRaios = raios + 20 * amt + ressurrectionBonus;
    setPracticedSports(nextSports);
    setRaios(nextRaios);
    const streakResult = registerDailyActivity();
    saveProfileNow({
      practicedSports: nextSports,
      raios: nextRaios,
      currentStreak: streakResult.streak,
      longestStreak: streakResult.longest,
      streakShields: streakResult.shields,
      lastActivityDate: streakResult.lastDate,
    });
    if (wasRotten) {
      setNotificationQueue((prev) => [...prev, { kind: "resurrection-self" as const, bonus: ressurrectionBonus }]);
      if (currentBananeira) {
        registerResurrection(currentBananeira.id).catch(() => {});
      }
    }
    redeemPendingPokes().catch(() => {});
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-5xl">🍌</motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 md:p-10 overflow-hidden font-sans text-white">
      <div className="showcase-container grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-10 w-full max-w-6xl h-full max-h-[800px]">

        {/* Left Side Panel */}
        <div className="hidden lg:flex flex-col gap-6 side-panel">
          <div className="app-preview-card bg-[#111] border border-white/10 rounded-[24px] p-5 flex-1 flex flex-col justify-center items-center text-center cursor-pointer hover:border-banana/50 transition-colors" onClick={() => setCurrentScreen('splash')}>
            <div className="text-[10px] font-semibold uppercase tracking-[2px] text-banana mb-2">Início Rápido</div>
            <div className="text-4xl mb-4">🍌</div>
            <p className="text-xs text-white italic">"A saúde é um estado de espírito."</p>
          </div>
          <div className="app-preview-card bg-[#111] border border-white/10 rounded-[24px] p-5 flex-1 flex flex-col justify-center items-center text-center cursor-pointer hover:border-banana/50 transition-colors" onClick={() => setCurrentScreen('achievements')}>
            <div className="text-[10px] font-semibold uppercase tracking-[2px] text-banana mb-2">Conquistas & Metas</div>
            <div className="flex gap-2 mt-2 mb-4">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl">🥋</div>
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl">🏃</div>
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl">🔥</div>
            </div>
            <p className="text-xs text-white/50">Cumpra missões e fique On Fire.</p>
          </div>
        </div>

        {/* Center Phone Mockup */}
        <div className="phone-mockup bg-black rounded-[40px] border-[8px] border-[#222] relative flex flex-col overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] aspect-[9/19.5] max-h-[768px] mx-auto w-full max-w-[360px]">
          <div className="notch w-[120px] h-[30px] bg-[#222] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-[15px] z-30" />
          <div className="flex-1 relative overflow-hidden bg-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full"
              >
                {currentScreen === "splash" && <SplashScreen onNext={() => setCurrentScreen("login")} />}
                {currentScreen === "login" && <LoginScreen onSuccess={() => {}} />}
                {currentScreen === "health" && <HealthIntegrationScreen onNext={() => setCurrentScreen("onboarding")} />}
                {currentScreen === "onboarding" && <OnboardingScreen onNext={async () => {
                  if (user) {
                    await supabase.from('profiles').upsert({
                      id: user.id,
                      buddy_name: buddyName || 'Bananinha',
                      active_skin: activeSkin,
                      is_on_fire: isOnFire,
                      practiced_sports: practicedSports,
                      raios,
                      unlocked_store_skins: unlockedStoreSkins,
                      onboarding_done: true,
                    });
                  }
                  setCurrentScreen("dashboard");
                }} buddyName={buddyName} setBuddyName={setBuddyName} practicedSports={practicedSports} toggleSport={toggleSport} />}
                {currentScreen === "dashboard" && <DashboardScreen
                  onCustomization={() => setCurrentScreen("customization")}
                  onBananeiras={() => { saveProfileNow(); setCurrentScreen("bananeira-selection"); }}
                  onAchievements={() => setCurrentScreen("achievements")}
                  onLogout={() => supabase.auth.signOut()}
                  buddyName={buddyName || "Bananinha"}
                  activeSkin={activeSkin}
                  isOnFire={isOnFire}
                  raios={raios}
                  currentStreak={currentStreak}
                  streakShields={streakShields}
                  streakBadgeTitle={streakBadge(longestStreak)?.title ?? null}
                  supportCount={supportCount}
                  lastActivityDate={lastActivityDate}
                />}
                {currentScreen === "customization" && <CustomizationScreen onBack={() => setCurrentScreen("dashboard")} activeSkin={activeSkin} setActiveSkin={setActiveSkin} practicedSports={practicedSports} raios={raios} setRaios={setRaios} unlockedStoreSkins={unlockedStoreSkins} setUnlockedStoreSkins={setUnlockedStoreSkins} />}
                {currentScreen === "bananeira-selection" && <BananeiraSelectionScreen onBack={() => setCurrentScreen("dashboard")} onSelect={(id, name, founderId) => { saveProfileNow(); setCurrentBananeira({ id, name, founderId }); setCurrentScreen("bananeira-map"); }} />}
                {currentScreen === "bananeira-map" && currentBananeira && <BananeiraMapScreen
                  onBack={() => setCurrentScreen("bananeira-selection")}
                  bananeiraId={currentBananeira.id}
                  bananeiraName={currentBananeira.name}
                  founderId={currentBananeira.founderId}
                  currentUserId={user?.id ?? ""}
                  currentUserName={buddyName || "Bananinha"}
                  currentUserSkin={activeSkin}
                  currentUserIsOnFire={isOnFire}
                  currentUserScore={sportSessionsTotal(practicedSports)}
                  currentUserTopSport={topSportOf(practicedSports)}
                  currentUserStreak={currentStreak}
                  currentUserStreakShields={streakShields}
                  currentUserLastActivity={lastActivityDate}
                  practicedSports={practicedSports}
                  updateProgress={updateProgress}
                />}
                {currentScreen === "achievements" && <AchievementsScreen onBack={() => setCurrentScreen("dashboard")} practicedSports={practicedSports} toggleSport={toggleSport} updateProgress={updateProgress} isOnFire={isOnFire} setIsOnFire={setIsOnFire} raios={raios} />}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              {notificationQueue[0] && (
                <NotificationModal
                  notification={notificationQueue[0]}
                  onDismiss={dismissNotification}
                  onTrainNow={() => { dismissNotification(); setCurrentScreen("achievements"); }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side Panel */}
        <div className="hidden lg:flex flex-col gap-6 side-panel">
          <div className="app-preview-card bg-[#111] border border-white/10 rounded-[24px] p-5 flex-1 flex flex-col justify-center items-center text-center cursor-pointer hover:border-banana/50 transition-colors" onClick={() => setCurrentScreen('bananeira-selection')}>
            <div className="text-[10px] font-semibold uppercase tracking-[2px] text-banana mb-2">Mapa da Bananeira</div>
            <p className="text-xs text-white/50 mb-3">Veja o status do seu clã em tempo real.</p>
            <div className="relative w-full h-24 bg-black/40 rounded-xl overflow-hidden mt-2 border border-white/10">
              <div className="absolute left-4 top-4 text-2xl animate-pulse">🍌</div>
              <div className="absolute right-6 bottom-4 text-2xl grayscale">🍌</div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">🔥</div>
            </div>
          </div>
          <div className="app-preview-card bg-[#111] border border-white/10 rounded-[24px] p-5 flex-1 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[2px] text-banana mb-2">Integração</div>
            <div className="flex gap-4 mb-4 mt-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center"><Heart className="text-red-500 w-6 h-6 fill-current" /></div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center"><Chrome className="text-blue-500 w-6 h-6" /></div>
            </div>
            <p className="text-xs text-white/50">Conectado aos principais apps de saúde.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
