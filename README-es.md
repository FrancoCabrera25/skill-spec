[English](README.md) · [Español](README-es.md)

<p align="center">
  <h1 align="center">skill-spec</h1>
  <p align="center">Skills de diseño guiado por especificación (spec-driven) para Claude Code, Cursor, Codex, Antigravity y Gemini CLI.</p>
  <p align="center">Diseñá la feature. Aprobala. Implementala paso a paso. Cerrala con una versión y una entrada de changelog.</p>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Skills" src="https://img.shields.io/badge/skills-2-blue">
  <img alt="Agents" src="https://img.shields.io/badge/agents-5-blue">
</p>

## Inicio rápido

```bash
git clone https://github.com/francocabrera25/skill-spec ~/.skill-spec
cd ~/tu-proyecto
~/.skill-spec/scripts/install-to-agent.sh claude   # o: cursor | codex | antigravity | gemini
```

## Skills

| Skill | Comando | Descripción | Argumento |
| --- | --- | --- | --- |
| `spec-draft` | `spec-draft [tema-corto]` | Diseña el documento de la feature haciendo preguntas de clarificación. | — |
| `spec-impl` | `spec-impl <NN-slug>` | Valida que el spec esté aprobado, lo implementa paso a paso y después verifica los criterios de aceptación, sube la versión del proyecto y escribe la entrada en `CHANGELOG.md`. | `<NN-slug>` |

---

## Índice

- [Qué es el spec-driven design](#qué-es-el-spec-driven-design)
- [El problema que resuelve](#el-problema-que-resuelve)
- [Anatomía de un spec útil](#anatomía-de-un-spec-útil)
- [Cómo funciona este pack de skills](#cómo-funciona-este-pack-de-skills)
- [Cuándo usar specs y cuándo no](#cuándo-usar-specs-y-cuándo-no)
- [Instalación](#instalación)
- [Uso](#uso)
- [Configuración](#configuración)
- [Diferencias con fernando-skills](#diferencias-con-fernando-skills)
- [Licencia](#licencia)

---

## Qué es el spec-driven design

El spec-driven design (o spec-driven development) es un enfoque donde **el
spec es el artefacto de trabajo principal, no el código**. El código es la
consecuencia del spec, no al revés.

Suena obvio — "documentar antes de codear" no es nuevo — pero el spec-driven
design es más específico: el spec **no es documentación opcional o
decorativa escrita después de los hechos**. Es el contrato que guía la
ejecución, está versionado en el mismo repo que el código, y se mantiene
vivo a medida que el proyecto evoluciona. Si el código se desvía del spec,
uno de los dos está mal, y podés señalar cuál.

Cada spec captura las decisiones de una sola feature. Los specs viven en
`specs/` como archivos `.md` numerados secuencialmente (`specs/01-*.md`,
`specs/02-*.md`, ...), y en conjunto forman el registro de decisiones de
diseño del proyecto — la respuesta a "¿por qué esto funciona así?" dentro de
seis meses.

La idea viene de la práctica clásica de "spec antes que código" en
ingeniería de software, afilada para un mundo donde un agente de IA puede
escribir el código en segundos: para más contexto sobre el método en sí,
independiente de cualquier herramienta puntual, ver [esta nota sobre qué es
el spec-driven development, de dónde viene y por qué
importa](https://scrummanager.com/community/spec-driven-development-qu-es-de-dnde-viene-y-por-qu-importa).

## El problema que resuelve

Cuando trabajás con un agente de IA para codear, hay un fenómeno muy
concreto: si le pedís *"armame un carrito de compras con descuentos y
cupones"*, va a improvisar. Va a tomar decenas de decisiones de diseño
implícitas (¿clases o funciones? ¿dónde vive la lógica de descuentos? ¿cómo
se nombran y guardan los cupones?) sin que las veas. Y cada una se convierte
en un acoplamiento caro de revertir después.

Esto no es nuevo de la IA — los humanos también improvisan — pero acá es más
agudo por tres motivos:

1. **La velocidad de generación esconde el costo de las decisiones.** Un
   humano escribiendo un módulo a mano tiene tiempo de pensar entre línea y
   línea. Un agente lo hace en segundos, así que las decisiones quedan
   invisibles.
2. **Cada conversación arranca de cero.** Sin un spec, la próxima sesión no
   sabe qué decidiste antes, y puede improvisar en la dirección contraria.
3. **El contexto se llena rápido.** Sin un documento estable al que apuntar,
   terminás re-explicando a mano las mismas decisiones en cada prompt.

El spec resuelve los tres: hace explícitas las decisiones, persiste entre
sesiones como un archivo del repo, y se carga una sola vez como material de
referencia.

## Anatomía de un spec útil

No cualquier documento sirve. Un spec útil tiene estas partes — la skill
`spec-draft` no guarda uno al que le falte alguna de las obligatorias:

1. **Objetivo en una sola frase.** Si no entra en una frase, la feature es
   demasiado grande — hay que partirla antes de escribir nada más.
2. **Alcance explícito, lo que entra y lo que no.** El "fuera de alcance" es
   tan importante como el "en alcance" — es lo que frena el scope creep
   ("ya que estamos...") durante la implementación.
3. **Modelo de datos** con nombres concretos, cuando la feature introduce
   estructuras nuevas.
4. **Plan de implementación ordenado.** Pasos numerados, cada uno dejando el
   sistema en un estado funcional.
5. **Criterios de aceptación** — un checklist booleano y verificable. Este
   pack de skills lo refuerza con un chequeo de calidad explícito (ver
   abajo) en vez de solo recomendarlo.
6. **Decisiones tomadas y descartadas**, cada una con una razón breve. Es la
   sección con más valor a largo plazo — la que responde "¿por qué la
   persistencia usa una clave versionada?" tres meses después.

## Cómo funciona este pack de skills

### `spec-draft` — cuatro fases

1. **Contexto.** Lee el archivo de memoria del proyecto, probando en este
   orden y quedándose con el primero que encuentra: `CLAUDE.md` →
   `AGENTS.md` → `GEMINI.md` → `README.md`. Ese orden es deliberado: se
   adapta al agente que efectivamente esté corriendo la skill (Claude Code
   lee `CLAUDE.md`, Codex y otros leen `AGENTS.md`, Gemini CLI lee
   `GEMINI.md`), y cae al `README.md` común si ninguno de los archivos
   específicos existe. También lee el listado actual de `specs/` y, si ya
   hay specs previos, los dos más recientes — para copiar la numeración, el
   wording de las secciones y el idioma existentes en vez de arrancar un
   estilo propio.
2. **Clarificación.** Hace preguntas en bloques de 3 a 5 — alcance, datos,
   integración, persistencia, UX/estados, riesgos — hasta poder responder
   tres preguntas sin asumir nada: qué archivos cambian, cuál es el primer y
   el último paso ejecutable, y cómo verificar que la feature está
   terminada.
3. **Redacción.** Escribe el spec usando `spec-draft/template.md` como
   forma a seguir. Si la Fase 2 no dejó nada por asumir, escribe el spec
   completo de una y lo guarda; si no, va sección por sección con tu
   confirmación en cada una. En ambos casos, antes de guardar, vuelve a
   revisar cada criterio de aceptación por verificabilidad booleana y
   reescribe o pregunta por cualquier cosa vaga ("funciona bien", "rápido"
   sin número, etc.).
4. **Guardado.** Escribe `specs/NN-slug.md` con estado `Draft`, siembra
   `specs/.spec-config.yml` con los defaults si todavía no existe, y agrega
   o actualiza la fila de este spec en el índice `specs/README.md`. Nunca
   marca un spec como `Approved` — eso es un acto humano deliberado, abrís
   el archivo y cambiás el estado a mano.

### `spec-impl` — cinco fases

1. **Identificar** el archivo del spec por número, slug o nombre completo.
2. **Validar** que su estado signifique "Aprobado" — en *cualquier* idioma
   (`Approved`, `Aprobado`, `Approuvé`, ...). Cualquier otra cosa corta acá
   con una explicación; la skill nunca ofrece "igual empiezo si querés".
3. **Rama.** Crea y cambia a `spec-NN-slug` (o pregunta antes, si
   `AutoCreateBranch: false`), y después muestra el objetivo, alcance, plan
   y criterios de aceptación del spec antes de tocar código.
4. **Implementar**, un paso del plan a la vez, con pausa después de cada uno
   para que revises el diff. Las ambigüedades que el spec no resuelve
   frenan el flujo con opciones concretas en vez de improvisarse. Nunca
   commitea sola.
5. **Cerrar** (la fase que este pack agrega sobre el método base): una vez
   que todos los pasos están hechos, verifica cada criterio de aceptación
   con vos, clasifica el cambio (breaking / feature / fix), propone el bump
   de SemVer correspondiente leyendo la versión actual del tope de
   `CHANGELOG.md`, espera tu confirmación, escribe la entrada del
   changelog, marca el spec como `Implemented` con `Implemented in:
   vX.Y.Z`, actualiza el índice `specs/README.md`, y te recuerda que
   commitear, pushear y mergear la rama siguen siendo tarea tuya.

### Cómo lee tu proyecto

Las dos skills leen contexto en vez de asumir un proyecto en blanco:

- Leen el archivo de memoria del proyecto (`CLAUDE.md`/`AGENTS.md`/
  `GEMINI.md`/`README.md`, gana el primero que encuentran) para saber qué es
  el proyecto y cómo está organizado antes de preguntar o escribir nada.
- Leen `specs/` para copiar numeración, wording de secciones y — salvo que
  `Language` esté fijado en la config — el idioma ya en uso, para que un
  spec nuevo combine con los existentes en vez de irse por las suyas.
- Leen `specs/.spec-config.yml` para `AutoCreateBranch` y `Language`, y
  solo caen a los defaults cuando el archivo no existe.
- `spec-impl` además lee el tope de `CHANGELOG.md` para saber la versión
  actual del proyecto antes de proponer un bump.

## Cuándo usar specs y cuándo no

Esto tiene un costo — no se aplica a todo.

**Sí, escribí un spec, cuando:**
- La tarea toca más de dos archivos.
- Hay decisiones caras de revertir (esquemas de datos, formatos, APIs).
- La feature va a llevar más de una sesión del agente.
- Algo más va a reusar esto como contrato (otro spec, una skill, un hook).
- Es algo de lo que te vas a olvidar el motivo en una semana.

**No, usá un prompt directo, cuando:**
- Es un arreglo puntual de un bug.
- Es un refactor mecánico (renombres, mover archivos).
- Es un experimento exploratorio donde el objetivo es descubrir la decisión,
  no ejecutar una ya tomada.
- Entra en un prompt y se entiende a la primera lectura.
- Es una tarea de una sola vez que no se va a repetir.

## Instalación

### Claude Code

```bash
git clone https://github.com/francocabrera25/skill-spec ~/.skill-spec
cd ~/tu-proyecto
~/.skill-spec/scripts/install-to-agent.sh claude
```

O manualmente:

```bash
# Personal (todos tus proyectos)
mkdir -p ~/.claude/skills
cp -r skills/engineering/spec-draft ~/.claude/skills/
cp -r skills/engineering/spec-impl ~/.claude/skills/

# O por proyecto (versionado en git)
mkdir -p .claude/skills
cp -r skills/engineering/spec-draft .claude/skills/
cp -r skills/engineering/spec-impl .claude/skills/
```

### Cursor, Codex, Antigravity, Gemini CLI

```bash
git clone https://github.com/francocabrera25/skill-spec ~/.skill-spec
cd ~/tu-proyecto
~/.skill-spec/scripts/install-to-agent.sh <agente>
```

`<agente>` es uno de `cursor`, `codex`, `antigravity`, `gemini` — siempre
explícito, el script no intenta adivinar qué agente estás corriendo.

| Agente | Qué escribe |
| --- | --- |
| `claude` | Symlink de cada skill a `.claude/skills/` (por proyecto) |
| `cursor` | Genera `.cursor/rules/spec-draft.mdc` y `spec-impl.mdc` — se invocan con `@spec-draft`, `@spec-impl` |
| `codex` | Agrega un bloque `## Skills` a `AGENTS.md` y copia el cuerpo de cada skill a `.codex/skills/` |
| `antigravity` | Copia el cuerpo de cada skill a `.antigravity/skills/` |
| `gemini` | Agrega un bloque `## Skills` a `GEMINI.md` y copia el cuerpo de cada skill a `.gemini/skills/` |

Los campos de frontmatter específicos de Claude Code (`argument-hint`,
`disable-model-invocation`, `allowed-tools`) se sacan para el resto de los
agentes; las instrucciones de la skill se copian tal cual.

Para que el método funcione también necesitás una carpeta `specs/` en la
raíz de tu proyecto — `spec-draft` la crea (con `.spec-config.yml`) la
primera vez que la corrés, o la podés crear vos:

```bash
mkdir specs
cp ~/.skill-spec/specs/.spec-config.yml.example specs/.spec-config.yml   # opcional, spec-draft siembra los defaults igual
```

## Uso

```bash
# 1. Diseñar el spec con preguntas de clarificación
spec-draft niveles-y-puntajes

# Lee CLAUDE.md/AGENTS.md/GEMINI.md/README.md y los specs/ existentes,
# hace preguntas en bloques, redacta el spec, y lo guarda como
# specs/03-niveles-y-puntajes.md con estado Draft.

# 2. Releer el spec fuera del chat y aprobarlo a mano
#    (abrir el archivo, cambiar Status: Draft -> Approved)

# 3. Implementar el spec aprobado
spec-impl 03-niveles-y-puntajes

# Valida que el estado sea Approved, crea la rama
# spec-03-niveles-y-puntajes, muestra el resumen del spec, implementa
# paso a paso con pausas para revisar diffs, y después verifica los
# criterios de aceptación, propone un bump de versión, escribe la entrada
# en CHANGELOG.md y marca el spec como Implemented.
```

## Configuración

`specs/.spec-config.yml`:

```yaml
AutoCreateBranch: true   # false hace que spec-impl pregunte [y/N] antes de crear cualquier rama
Language: auto           # auto | es | en — ver abajo
```

**`Language`** controla el idioma en el que responden ambas skills:

- `auto` (default) — espeja el idioma del prompt inicial de cada comando,
  igual que la mayoría de las herramientas de spec-driven. Si escribís el
  primer mensaje en español, responde en español; si lo escribís en inglés,
  responde en inglés.
- `es` / `en` — fija el idioma sin importar cómo esté escrito cada prompt
  individual, útil para un equipo que quiere todos los specs y todas las
  entradas de changelog en el mismo idioma sin importar quién esté
  escribiendo ese día.

## Diferencias con fernando-skills

Este pack se construye sobre el mismo método base que
[`Klerith/fernando-skills`](https://github.com/Klerith/fernando-skills) (el
flujo de diseño en cuatro fases, `specs/NN-slug.md`, el chequeo de estado
que no depende del idioma, la regla de nunca commitear solo) — crédito a ese
repo por el diseño base. Sobre eso:

- **`spec-impl` cierra el círculo.** El `/spec-impl` de fernando-skills se
  corta después del último paso de implementación; la Fase 5 de este pack
  verifica los criterios de aceptación, propone un bump de SemVer, escribe
  la entrada en `CHANGELOG.md` y marca el spec como `Implemented` antes de
  devolver el control.
- **Idioma configurable**, no solo auto-espejado. `Language: es|en` en
  `specs/.spec-config.yml` fija el idioma para todo un equipo/proyecto.
- **Índice de specs vivo.** `specs/README.md` lo mantienen actualizado las
  dos skills automáticamente, en vez de ser una doc estática opcional.
- **Chequeo explícito de calidad de criterios de aceptación** en
  `spec-draft`, no solo un consejo en una lista de "errores comunes".
- **Campo `Supersedes`** en el header, junto a `Depends on`, para trazar qué
  spec reemplaza a uno anterior.
- **Soporte para Gemini CLI** sumado al instalador multi-agente, junto a
  Claude Code, Cursor, Codex y Antigravity.
- **Nombres de comando distintos** (`spec-draft` / `spec-impl` en vez de
  `/spec` / `/spec-impl`) para poder distinguir los dos packs fácil si
  tenés ambos instalados.
- **Sin automatización de releases para este propio repo.**
  Deliberadamente más simple que el setup de CI con release-please y
  Conventional Commits de fernando-skills — el `CHANGELOG.md` de este repo
  se mantiene a mano, para que sea fácil de forkear.

## Licencia

MIT
