
import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../store';
import { View, NotificationChannel } from '../types';

interface SettingsViewProps {
  setCurrentView: (view: View) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ setCurrentView }) => {
  const { settings, setSettings, exportAllData, importAllData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const headerImageRef = useRef<HTMLInputElement>(null);
  const audioInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(settings.profile.name);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const checkBiometry = async () => {
      if (window.PublicKeyCredential) {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricAvailable(available);
      } else {
        setBiometricAvailable(false);
      }
    };
    checkBiometry();
  }, []);

  const requestNotifPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        alert("Notifications activées !");
      }
    }
  };

  const updateNotifChannel = (key: keyof typeof settings.notifications, updates: Partial<NotificationChannel>) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: { ...settings.notifications[key], ...updates }
      }
    });
  };

  const handleSoundUpload = (key: keyof typeof settings.notifications, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNotifChannel(key, { soundUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const playPreview = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.log("Playback error", e));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const success = importAllData(content);
        if (success) {
          alert('Données importées avec succès !');
        } else {
          alert('Erreur lors de l\'importation. Format invalide.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({
          ...settings,
          profile: {
            ...settings.profile,
            photo: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({
          ...settings,
          profile: {
            ...settings.profile,
            headerImage: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileName = () => {
    setSettings({
      ...settings,
      profile: {
        ...settings.profile,
        name: tempName
      }
    });
    setIsEditingProfile(false);
  };

  const toggleBiometric = async () => {
    if (!biometricAvailable || isAuthenticating) return;

    if (settings.security.biometricEnabled) {
      setIsAuthenticating(true);
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const options: any = {
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: "required",
            allowCredentials: []
          }
        };
        await navigator.credentials.get(options);
        
        setSettings({
          ...settings,
          security: { ...settings.security, biometricEnabled: false }
        });
      } catch (err) {
        console.error("Désactivation biométrique annulée ou échouée", err);
      } finally {
        setIsAuthenticating(false);
      }
    } 
    else {
      setSettings({
        ...settings,
        security: { ...settings.security, biometricEnabled: true }
      });
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="mt-2 space-y-1 px-1">
        <h1 className="text-2xl font-black tracking-tight text-text-main">Réglages</h1>
        <p className="text-sm text-text-muted font-medium">Gérez vos préférences et vos données.</p>
      </header>

      {/* 👤 My Profile Section */}
      <section className="bg-card rounded-[32px] p-8 border border-border-main shadow-sm flex flex-col items-center space-y-4">
        <div className="relative group">
          <button 
            onClick={() => profilePhotoRef.current?.click()}
            className="size-[110px] rounded-full border-4 border-background overflow-hidden shadow-lg transition-transform active:scale-95 group-hover:brightness-90"
          >
            <img 
              src={settings.profile.photo} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
               <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
            </div>
          </button>
          <input 
            type="file" 
            ref={profilePhotoRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handlePhotoUpload} 
          />
        </div>

        <div className="w-full text-center space-y-4">
          {!isEditingProfile ? (
            <div className="space-y-2">
              <h2 className="text-xl font-black text-text-main tracking-tight">{settings.profile.name}</h2>
              <button 
                onClick={() => {
                  setTempName(settings.profile.name);
                  setIsEditingProfile(true);
                }}
                className="text-[10px] font-black text-primary uppercase tracking-widest px-4 py-1.5 bg-primary/5 rounded-full hover:bg-primary/10 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="space-y-3 px-4">
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full bg-background border-none rounded-xl text-center font-black text-text-main focus:ring-primary shadow-inner py-3"
                placeholder="Votre nom..."
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-text-muted border border-border-main"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveProfileName}
                  className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-white bg-primary shadow-md shadow-primary/20"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 🖼️ Dashboard Customization */}
      <section className="bg-card rounded-[32px] p-7 border border-border-main shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">🖼️ Apparence</h3>
        <div className="space-y-4">
          <p className="text-xs font-bold text-text-main uppercase tracking-tight">Image de Header Dashboard</p>
          <button 
            onClick={() => headerImageRef.current?.click()}
            className="w-full aspect-[18/5] rounded-2xl bg-background border-2 border-dashed border-border-main flex flex-col items-center justify-center gap-2 overflow-hidden group active:scale-[0.98] transition-all"
          >
            {settings.profile.headerImage ? (
              <img src={settings.profile.headerImage} className="w-full h-full object-cover" alt="Header Preview" />
            ) : (
              <>
                <span className="material-symbols-outlined text-slate-300">add_photo_alternate</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Choisir l'image (1080x300)</span>
              </>
            )}
          </button>
          <input 
            type="file" 
            ref={headerImageRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleHeaderUpload} 
          />
          {settings.profile.headerImage && (
             <button 
               onClick={() => setSettings({...settings, profile: {...settings.profile, headerImage: ''}})}
               className="w-full py-2 text-[9px] font-black text-accent-red uppercase tracking-widest bg-accent-red/5 rounded-xl border border-accent-red/10"
             >
               Supprimer l'image
             </button>
          )}
        </div>
      </section>

      {/* 🔐 Security Section */}
      <section className="bg-card rounded-[32px] p-7 border border-border-main shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">🔐 Sécurité</h3>
        <div className={`p-4 rounded-[24px] bg-background/40 border border-border-main transition-all ${biometricAvailable === false ? 'opacity-50 grayscale' : 'opacity-100'}`}>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`size-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${settings.security.biometricEnabled ? 'text-primary' : 'text-slate-300'}`}>
                    <span className="material-symbols-outlined">{isAuthenticating ? 'sync' : 'fingerprint'}</span>
                 </div>
                 <div>
                    <p className="text-xs font-black text-text-main uppercase tracking-tight">Accès Biométrique</p>
                    <p className="text-[9px] text-text-muted font-bold uppercase">
                        {isAuthenticating ? 'Vérification...' : 'Protéger le Wallet'}
                    </p>
                 </div>
              </div>
              <button 
                disabled={biometricAvailable === false || isAuthenticating}
                onClick={toggleBiometric}
                className={`w-10 h-5 rounded-full relative transition-colors ${settings.security.biometricEnabled ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <div className={`size-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.security.biometricEnabled ? 'left-6' : 'left-0.5 shadow-sm'}`}></div>
              </button>
           </div>
           {biometricAvailable === false && (
             <p className="mt-3 text-[9px] font-black text-accent-red uppercase text-center">Aucun capteur biométrique détecté</p>
           )}
           {settings.security.biometricEnabled && !isAuthenticating && (
             <p className="mt-3 text-[8px] font-black text-emerald-600 uppercase text-center opacity-60">Protection Active</p>
           )}
        </div>
      </section>

      {/* 🔔 Notifications Center */}
      <section className="bg-card rounded-[32px] p-7 border border-border-main shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">🔔 Notification Center</h3>
          <button 
            onClick={requestNotifPermission}
            className="text-[9px] font-black text-primary uppercase border border-primary/30 px-3 py-1 rounded-full active:scale-95"
          >
            Autoriser Système
          </button>
        </div>
        
        <div className="space-y-4">
          <SoundControlItem 
            title="Trade Gagné"
            subtitle="Célébration du profit"
            icon="trending_up"
            color="text-primary"
            config={settings.notifications.winTrade}
            onToggleEnabled={() => updateNotifChannel('winTrade', { enabled: !settings.notifications.winTrade.enabled })}
            onToggleSound={() => updateNotifChannel('winTrade', { soundEnabled: !settings.notifications.winTrade.soundEnabled })}
            onPlay={() => playPreview(settings.notifications.winTrade.soundUrl)}
            onUploadClick={() => audioInputRefs.current['winTrade']?.click()}
            inputRef={(el) => (audioInputRefs.current['winTrade'] = el)}
            onFileChange={(e) => handleSoundUpload('winTrade', e)}
          />

          <SoundControlItem 
            title="Trade Perdu"
            subtitle="Apprendre de ses erreurs"
            icon="trending_down"
            color="text-accent-red"
            config={settings.notifications.lossTrade}
            onToggleEnabled={() => updateNotifChannel('lossTrade', { enabled: !settings.notifications.lossTrade.enabled })}
            onToggleSound={() => updateNotifChannel('lossTrade', { soundEnabled: !settings.notifications.lossTrade.soundEnabled })}
            onPlay={() => playPreview(settings.notifications.lossTrade.soundUrl)}
            onUploadClick={() => audioInputRefs.current['lossTrade']?.click()}
            inputRef={(el) => (audioInputRefs.current['lossTrade'] = el)}
            onFileChange={(e) => handleSoundUpload('lossTrade', e)}
          />

          <SoundControlItem 
            title="Objectif Atteint"
            subtitle="Paliers de performance"
            icon="workspace_premium"
            color="text-amber-500"
            config={settings.notifications.objectiveReached}
            onToggleEnabled={() => updateNotifChannel('objectiveReached', { enabled: !settings.notifications.objectiveReached.enabled })}
            onToggleSound={() => updateNotifChannel('objectiveReached', { soundEnabled: !settings.notifications.objectiveReached.soundEnabled })}
            onPlay={() => playPreview(settings.notifications.objectiveReached.soundUrl)}
            onUploadClick={() => audioInputRefs.current['objectiveReached']?.click()}
            inputRef={(el) => (audioInputRefs.current['objectiveReached'] = el)}
            onFileChange={(e) => handleSoundUpload('objectiveReached', e)}
          />

          <SoundControlItem 
            title="Mantra Quotidien"
            subtitle="Focus et discipline"
            icon="psychology"
            color="text-purple-500"
            config={settings.notifications.dailyMantra}
            onToggleEnabled={() => updateNotifChannel('dailyMantra', { enabled: !settings.notifications.dailyMantra.enabled })}
            onToggleSound={() => updateNotifChannel('dailyMantra', { soundEnabled: !settings.notifications.dailyMantra.soundEnabled })}
            onPlay={() => playPreview(settings.notifications.dailyMantra.soundUrl)}
            onUploadClick={() => audioInputRefs.current['dailyMantra']?.click()}
            inputRef={(el) => (audioInputRefs.current['dailyMantra'] = el)}
            onFileChange={(e) => handleSoundUpload('dailyMantra', e)}
          />
        </div>
      </section>

      {/* 📊 Trading Report Section */}
      <section className="bg-card rounded-[32px] p-7 border border-border-main shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">📊 Trading Report</h3>
        
        <button 
          onClick={() => setCurrentView('Report')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-background/50 hover:bg-background transition-all group border border-transparent hover:border-border-main"
        >
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-text-main">Trading Report</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Générer PDF / Excel</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>
      </section>

      {/* 💾 Data Management Section */}
      <section className="bg-card rounded-[32px] p-7 border border-border-main shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">💾 Data Management</h3>
        
        <div className="grid grid-cols-1 gap-3 pt-1">
          <button 
            onClick={exportAllData}
            className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 hover:bg-background transition-colors group"
          >
            <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined">download</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-text-main">Exporter Backup</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Sauvegarde JSON</p>
            </div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 hover:bg-background transition-colors group"
          >
            <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined">upload</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-text-main">Importer Backup</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Restaurer données</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              className="hidden" 
              accept=".json"
            />
          </button>
        </div>
      </section>

      <div className="text-center pt-8 opacity-40">
        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">FIKO Trading Studio v1.5.0</p>
      </div>
    </div>
  );
};

const SoundControlItem = ({ 
  title, 
  subtitle, 
  icon, 
  color, 
  config, 
  onToggleEnabled, 
  onToggleSound, 
  onPlay, 
  onUploadClick, 
  inputRef, 
  onFileChange 
}: any) => (
  <div className={`p-4 rounded-[24px] bg-background/40 border border-border-main transition-all ${config.enabled ? 'opacity-100' : 'opacity-60'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${color}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="text-xs font-black text-text-main uppercase tracking-tight">{title}</p>
          <p className="text-[9px] text-text-muted font-bold uppercase">{subtitle}</p>
        </div>
      </div>
      <button 
        onClick={onToggleEnabled}
        className={`w-10 h-5 rounded-full relative transition-colors ${config.enabled ? 'bg-primary' : 'bg-slate-200'}`}
      >
        <div className={`size-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${config.enabled ? 'left-6' : 'left-0.5 shadow-sm'}`}></div>
      </button>
    </div>

    {config.enabled && (
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-border-main/50">
        <div className="flex items-center gap-2">
           <button 
             onClick={onToggleSound}
             className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${config.soundEnabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-text-muted'}`}
           >
             <span className="material-symbols-outlined text-sm">{config.soundEnabled ? 'volume_up' : 'volume_off'}</span>
             <span className="text-[8px] font-black uppercase">Audio</span>
           </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onPlay}
            className="size-8 rounded-full bg-white flex items-center justify-center text-text-main border border-border-main active:scale-90 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
          </button>
          <button 
            onClick={onUploadClick}
            className="text-[9px] font-black text-text-muted uppercase border-b border-dotted border-text-muted/50 pb-0.5"
          >
            Custom Sound
          </button>
          <input 
            type="file" 
            className="hidden" 
            accept="audio/*"
            ref={inputRef}
            onChange={onFileChange}
          />
        </div>
      </div>
    )}
  </div>
);

export default SettingsView;
