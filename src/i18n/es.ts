// Textos de interfaz en español (tuteo). Ningún texto visible vive dentro de los componentes.

export const es = {
  comun: {
    volver: 'Volver',
    continuar: 'Continuar',
    reintentar: 'Reintentar',
    cargando: 'Cargando…',
    errorGenerico: 'Algo salió mal. Inténtalo de nuevo.',
    sinConexion: 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.',
    mostrarContrasena: 'Mostrar contraseña',
    ocultarContrasena: 'Ocultar contraseña',
    seleccionado: 'Seleccionado',
  },
  bienvenida: {
    titulo: 'Pequeños pasos.\nGrandes cambios.',
    descripcion:
      'Construye rutinas sostenibles con metas flexibles y cero culpas si necesitas una pausa.',
    crearCuenta: 'Crear cuenta',
    yaTienesCuenta: '¿Ya tienes una cuenta?',
    iniciaSesion: 'Inicia sesión',
    ilustracion: 'Persona paseando en bicicleta',
  },
  auth: {
    correo: 'Correo',
    correoPlaceholder: 'tucorreo@ejemplo.com',
    contrasena: 'Contraseña',
    confirmarContrasena: 'Confirmar contraseña',
    nuevaContrasena: 'Nueva contraseña',
    login: {
      titulo: '¡Bienvenid@ de vuelta!',
      boton: 'Iniciar sesión',
      olvidaste: '¿Olvidaste tu contraseña?',
      noTienesCuenta: '¿No tienes una cuenta?',
      registrate: 'Regístrate',
    },
    registro: {
      titulo: 'Crear una cuenta',
      boton: 'Crear cuenta',
      yaTienesCuenta: '¿Ya tienes cuenta?',
      iniciaSesion: 'Inicia sesión',
    },
    revisaCorreo: {
      titulo: 'Revisa tu correo',
      descripcion:
        'Te enviamos un enlace a {correo}. Ábrelo desde este teléfono para confirmar tu cuenta.',
      reenviar: 'Reenviar correo',
      reenviado: 'Listo, te enviamos otro correo.',
      irALogin: 'Ya confirmé, iniciar sesión',
    },
    recuperar: {
      titulo: 'Recupera tu contraseña',
      descripcion: 'Escribe tu correo y te enviaremos un código para crear una nueva.',
      boton: 'Enviar código',
    },
    recuperarCodigo: {
      titulo: 'Escribe el código',
      descripcion:
        'Si hay una cuenta con {correo}, te llegará un código. Puede tardar unos minutos; revisa también la carpeta de spam.',
      codigo: 'Código',
      boton: 'Continuar',
      reenviar: 'Reenviar código',
      reenviado: 'Listo, te enviamos otro código.',
      invalido: 'El código no es correcto o ya expiró. Revísalo o pide uno nuevo.',
    },
    nuevaContrasenaPantalla: {
      titulo: 'Crea una nueva contraseña',
      boton: 'Guardar contraseña',
      exito: 'Listo, tu contraseña quedó actualizada.',
    },
    callback: {
      procesando: 'Abriendo tu cuenta…',
      error: 'El enlace ya no es válido o expiró. Pide uno nuevo.',
      irAlInicio: 'Ir al inicio',
    },
    validacion: {
      correoRequerido: 'Escribe tu correo.',
      correoInvalido: 'Revisa que el correo esté bien escrito.',
      contrasenaRequerida: 'Escribe tu contraseña.',
      contrasenaCorta: 'Usa al menos 8 caracteres.',
      contrasenasDistintas: 'Las contraseñas no coinciden.',
      codigoRequerido: 'Escribe el código del correo.',
      codigoInvalido: 'El código solo lleva números, sin espacios.',
    },
    errores: {
      credenciales: 'El correo o la contraseña no coinciden.',
      correoNoConfirmado: 'Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.',
      usuarioExiste: 'Ya hay una cuenta con ese correo. Inicia sesión.',
      demasiadosIntentos: 'Hiciste muchos intentos seguidos. Espera unos minutos.',
      contrasenaDebil: 'Esa contraseña es fácil de adivinar. Prueba con otra más larga.',
      mismaContrasena: 'La nueva contraseña debe ser distinta de la anterior.',
    },
  },
  onboarding: {
    empezar: {
      titulo: '¡Hola, bienvenid@ a Habit Green!',
      descripcion:
        'Descompón tus hábitos en micro-pasos, enfócate a tu ritmo y adapta tus metas según tu energía diaria. Aquí celebramos cada avance.',
      boton: 'Empezar',
      ilustracion: 'Persona caminando entre árboles',
    },
    modo: {
      titulo: '¿Cómo quieres empezar?',
      ayuda: 'Puedes crear tus propios hábitos en cualquier momento.',
      guiadoTitulo: 'Quiero un plan para mí',
      guiadoDescripcion: 'Respondes 7 preguntas y te armamos un plan que empieza ligero.',
      tradicionalTitulo: 'Prefiero crear mis hábitos',
      tradicionalDescripcion: 'Tú eliges cada hábito, sus días y su hora.',
      boton: 'Continuar',
      error: 'No pudimos guardar tu elección. Inténtalo de nuevo.',
    },
    formulario: {
      continuar: 'Continuar',
      crearPlan: 'Crear mi plan',
      limite: 'Elige hasta 2 para empezar con poca carga. Podrás agregar más después.',
      preguntas: {
        areas: {
          titulo: '¿En qué áreas te gustaría empezar?',
          ayuda: 'Elige hasta 2. Podrás sumar más cuando estas ya sean parte de tu día.',
        },
        objetivos: {
          titulo: '¿Qué te gustaría lograr primero?',
          ayuda: 'Elige hasta 2.',
        },
        historial: {
          titulo: 'Cuando has intentado crear un hábito, ¿qué suele pasar?',
          ayuda: 'No hay respuesta mala: nos ayuda a empezar a tu ritmo.',
        },
        tiempo: {
          titulo: '¿Cuánto tiempo al día te gustaría dedicarle?',
          ayuda: 'Es tu límite. Empezaremos con menos para que sea fácil.',
        },
        momento: {
          titulo: '¿En qué momento del día tienes más espacio libre?',
          ayuda: 'Podrás ajustar la hora exacta al revisar tu plan.',
        },
        obstaculo: {
          titulo: '¿Qué es lo que más se te complica para ser constante?',
          ayuda: 'Elige la que más se parezca a ti.',
        },
        acompanamiento: {
          titulo: '¿Cómo te gustaría que Habit Green te acompañe?',
          ayuda: 'Puedes cambiarlo cuando quieras en Perfil.',
        },
      },
      areas: {
        salud_fisica: 'Salud física',
        trabajo: 'Trabajo / Estudio',
        salud_mental: 'Salud mental',
        finanzas: 'Finanzas',
        social: 'Social',
      },
      objetivos: {
        mover_mas: 'Moverme más',
        dormir_mejor: 'Dormir mejor',
        comer_mejor: 'Comer mejor',
        tomar_agua: 'Tomar más agua',
        organizar_dia: 'Organizar mejor mi día',
        procrastinar_menos: 'Procrastinar menos',
        aprender_algo: 'Aprender algo nuevo',
        manejar_estres: 'Manejar mejor el estrés',
        desconectar_pantallas: 'Desconectarme de las pantallas',
        tiempo_para_mi: 'Tomarme tiempo para mí',
        saber_gastos: 'Saber en qué gasto',
        empezar_ahorrar: 'Empezar a ahorrar',
        evitar_impulsivas: 'Evitar compras impulsivas',
        mantener_contacto: 'Mantener contacto con las personas que quiero',
        tiempo_de_calidad: 'Pasar tiempo de calidad con alguien',
        conocer_gente: 'Conocer gente nueva',
      },
      historial: {
        primera_vez: 'Es mi primera vez',
        empieza_y_deja: 'Empiezo con ganas, pero lo dejo en pocos días',
        semanas_y_suelta: 'Lo sostengo unas semanas y luego lo suelto',
        mantiene: 'Casi siempre logro mantenerlo',
      },
      tiempo: {
        menos_10: 'Menos de 10 min',
        '10_20': '10 a 20 min',
        '20_40': '20 a 40 min',
        mas_40: 'Más de 40 min',
      },
      momento: {
        manana: 'Mañana',
        mediodia: 'Mediodía',
        tarde: 'Tarde',
        noche: 'Noche',
        varia: 'Varía mucho, mi horario cambia',
      },
      obstaculo: {
        poco_tiempo: 'No me alcanza el tiempo',
        olvido: 'Se me olvida',
        motivacion: 'Pierdo la motivación',
        desanimo: 'Me desanimo cuando fallo un día',
        distraccion: 'Me distraigo fácilmente',
        recursos: 'No tengo los recursos o el espacio',
      },
      acompanamiento: {
        resumen_nocturno: 'Un resumen cada noche con lo de mañana',
        recordatorio_suave: 'Un aviso suave a la hora de cada hábito',
        recordatorio_y_animo: 'Avisos con mensajes de ánimo',
        minimo: 'Lo mínimo, prefiero llevarlo yo',
      },
    },
    generando: {
      preparando: 'Estamos preparando tu plan…',
      lento: 'Sigue en proceso…',
      sinConexion: 'Necesitas conexión para crear tu plan.',
      error: 'No pudimos preparar tu plan. Inténtalo de nuevo.',
      reintentar: 'Reintentar',
      ilustracion: 'Planta creciendo',
    },
    revision: {
      titulo: 'Tu plan',
      resumenCatalogo:
        'Empezamos con poco para que sea fácil de sostener. Cuando estos hábitos ya sean parte de tu día, sumamos más.',
      minutos: '{n} min',
      todosLosDias: 'Todos los días',
      dias: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      flexible: 'Entre {inicio} y {fin}',
      cambiarHora: 'Cambiar hora',
      bajarNivel: 'Bajar nivel',
      quitar: 'Quitar',
      segundoAviso: 'Segundo aviso',
      segundoAvisoAyuda: 'Si todavía no lo marcas, te avisamos otra vez 2 horas después.',
      apoyoProfesional:
        'Estos hábitos ayudan a sentirte mejor día a día. Si el malestar es intenso o no mejora, hablar con un profesional de la salud puede ayudarte.',
      empezar: 'Empezar',
      errorGuardar: 'No pudimos guardar tu plan. Revisa tu conexión e inténtalo de nuevo.',
    },
  },
  tabs: {
    hoy: 'Hoy',
    habitos: 'Hábitos',
    estadisticas: 'Estadísticas',
    jardin: 'Jardín',
    perfil: 'Perfil',
  },
  hoy: {
    saludo: 'Hola',
    vacio: 'Hoy no tienes hábitos programados. Disfruta el día.',
    proximamente: 'Tu árbol crece con cada micro-paso.',
  },
  habitos: {
    vacio: 'Todavía no tienes hábitos. Crea el primero.',
  },
  estadisticas: {
    vacio: 'Cuando completes tus primeros hábitos, aquí verás tu avance.',
  },
  jardin: {
    vacio: 'Tus plantas crecen cuando agregues hábitos.',
  },
  perfil: {
    sesionIniciada: 'Sesión iniciada como',
    modoGuiado: 'Modo: plan guiado',
    modoTradicional: 'Modo: mis propios hábitos',
    cerrarSesion: 'Cerrar sesión',
  },
  sesion: {
    errorPerfil: 'No pudimos cargar tu perfil.',
  },
} as const;

/** Reemplaza variables como {correo} dentro de un texto. */
export function formatear(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (coincidencia, clave: string) =>
    clave in valores ? String(valores[clave]) : coincidencia,
  );
}
