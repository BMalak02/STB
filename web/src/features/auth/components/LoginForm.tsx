import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';

export const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, isLoggingIn, error } = useAuth();

  const onSubmit = async (data: any) => {
    try {
      await login(data);
      alert('Connexion réussie !');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
      
      <h2 className="text-3xl font-extrabold mb-2 text-white">Connexion</h2>
      <p className="text-slate-400 text-sm mb-6">Accédez à votre tableau de bord sécurisé.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {(error as any).message || 'Une erreur est survenue lors de la connexion'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input
            type="email"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="votre.email@domain.com"
            {...register('email', { required: "L'email est requis" })}
          />
          {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message as string}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe</label>
          <input
            type="password"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="••••••••"
            {...register('password', { required: "Le mot de passe est requis" })}
          />
          {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message as string}</span>}
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-3 font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          {isLoggingIn ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
};
