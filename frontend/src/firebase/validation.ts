// src/firebase/validation.ts
export type RegisterForm = {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  fullName: string;
};

export function validateRegisterForm(data: RegisterForm): string[] {
  const errors: string[] = [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("El correo electrónico no es válido.");
  }

  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strong.test(data.password)) {
    errors.push("La contraseña debe tener mínimo 8 caracteres con mayúscula, minúscula y número.");
  }

  if (data.password !== data.confirmPassword) {
    errors.push("Las contraseñas no coinciden.");
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
    errors.push("El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números o _).");
  }

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push("El nombre completo debe tener al menos 2 caracteres.");
  }

  return errors;
}
