export const validateRegister = (email: string, password: string, nickname: string) => {
  const errors: string[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nicknameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

  if (!email) errors.push("El email es obligatorio");
  else if (!emailRegex.test(email)) errors.push("El formato del email es inválido");

  if (!password) errors.push("La contraseña es obligatoria");
  else if (!passwordRegex.test(password)) {
    errors.push("La contraseña debe tener como mínimo 8 caracteres, letras y números");
  }

  if (!nickname) errors.push("El nickname es obligatorio");
  else if (!nicknameRegex.test(nickname)) {
    errors.push("El nickname es inválido (deben tener 3-20 letras/números/_)");
  }

  if (errors.length) {
    const error = new Error(errors.join(" | "));
    (error as any).status = 400;
    throw error;
  }
};

export const validateLogin = (email: string, password: string) => {
  if (!email || !password) {
    const error = new Error("El email y la contraseña son obligatorios");
    (error as any).status = 400;
    throw error;
  }
};