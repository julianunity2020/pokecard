<script setup>
import { onMounted, ref } from 'vue'
import { getPokemon, getPokemonList, getPokemonType } from './api/pokeapi.js'

const pokemon = ref(null)
const typeData = ref({})
const loading = ref(true)
const error = ref('')

const typeStyles = {
  normal: { color: '#b5aa88', emoji: '⚪' },
  fire: { color: '#f08030', emoji: '🔥' },
  water: { color: '#6890f0', emoji: '💧' },
  electric: { color: '#f8d030', emoji: '⚡' },
  grass: { color: '#78c850', emoji: '🌿' },
  ice: { color: '#98d8d8', emoji: '❄️' },
  fighting: { color: '#c03028', emoji: '🥊' },
  poison: { color: '#a040a0', emoji: '☠️' },
  ground: { color: '#e0c068', emoji: '🌍' },
  flying: { color: '#a890f0', emoji: '🌪️' },
  psychic: { color: '#f85888', emoji: '🔮' },
  bug: { color: '#a8b820', emoji: '🐛' },
  rock: { color: '#b8a038', emoji: '🗿' },
  ghost: { color: '#705898', emoji: '👻' },
  dragon: { color: '#7038f8', emoji: '🐉' },
  dark: { color: '#705848', emoji: '🌙' },
  steel: { color: '#b8b8d0', emoji: '⚙️' },
  fairy: { color: '#ee99ac', emoji: '✨' },
}

const statLabels = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'Ataque especial',
  'special-defense': 'Defensa especial',
  speed: 'Velocidad',
}

function typeColor(name) {
  return typeStyles[name]?.color ?? '#94a3b8'
}

function typeEmoji(entry) {
  return typeStyles[entry.types[0]?.type.name]?.emoji ?? '⭐'
}

function cardStyle(entry) {
  const firstColor = typeColor(entry.types[0]?.type.name)
  const secondColor = typeColor(entry.types[1]?.type.name ?? entry.types[0]?.type.name)
  return { background: `linear-gradient(145deg, ${firstColor}, ${secondColor})` }
}

function imageUrl(entry) {
  return (
    entry.sprites.other?.['official-artwork']?.front_default ||
    entry.sprites.other?.home?.front_default ||
    entry.sprites.front_default
  )
}

function weaknesses(entry) {
  const defendingTypes = entry.types.map(({ type }) => type.name)
  const possibleWeaknesses = new Set()

  for (const typeName of defendingTypes) {
    const relations = typeData.value[typeName]?.damage_relations
    for (const attackType of relations?.double_damage_from ?? []) {
      possibleWeaknesses.add(attackType.name)
    }
  }

  return [...possibleWeaknesses]
    .filter((attackType) => {
      const multiplier = defendingTypes.reduce((result, defendingType) => {
        const relations = typeData.value[defendingType]?.damage_relations
        if (relations?.no_damage_from.some((type) => type.name === attackType)) return 0
        if (relations?.double_damage_from.some((type) => type.name === attackType)) return result * 2
        if (relations?.half_damage_from.some((type) => type.name === attackType)) return result / 2
        return result
      }, 1)

      return multiplier > 1
    })
    .sort()
}

async function loadRandomPokemon() {
  loading.value = true
  error.value = ''

  try {
    const { count } = await getPokemonList(1)
    const randomId = Math.floor(Math.random() * count) + 1
    const selectedPokemon = await getPokemon(String(randomId))
    const typeNames = selectedPokemon.types.map(({ type }) => type.name)
    const missingTypes = typeNames.filter((name) => !typeData.value[name])
    const loadedTypes = await Promise.all(
      missingTypes.map(async (name) => [name, await getPokemonType(name)]),
    )

    for (const [name, data] of loadedTypes) {
      typeData.value[name] = data
    }

    pokemon.value = selectedPokemon
  } catch (err) {
    console.error('No se pudo cargar un Pokémon aleatorio:', err)
    error.value = 'No se pudo cargar el Pokémon. Revisa tu conexión e inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

onMounted(loadRandomPokemon)
</script>

<template>
  <main class="pokedex">
    <section class="collection" aria-label="Pokécarta aleatoria">
      <p v-if="error" class="message" role="alert">{{ error }}</p>
      <div v-if="loading" class="loading-state" role="status">
        <span class="loader" aria-hidden="true"></span>
        <p>Buscando un Pokémon al azar...</p>
      </div>
      <article v-else-if="pokemon" class="pokemon-card">
          <div class="art-panel" :style="cardStyle(pokemon)">
            <div class="art-heading">
              <span>N.º {{ String(pokemon.id).padStart(3, '0') }}</span>
              <span class="pokemon-emoji" :aria-label="`Emoji de tipo ${pokemon.types[0].type.name}`">
                {{ typeEmoji(pokemon) }}
              </span>
            </div>
            <img :src="imageUrl(pokemon)" :alt="`Ilustración de ${pokemon.name}`" />
            <div class="physical">
              <span>Altura: {{ (pokemon.height / 10).toFixed(1) }} m</span>
              <span>Peso: {{ (pokemon.weight / 10).toFixed(1) }} kg</span>
            </div>
          </div>

          <div class="identity">
            <span class="large-number">N° {{ String(pokemon.id).padStart(3, '0') }}</span>
            <h2>{{ pokemon.name }}</h2>
            <section>
              <h3>Tipo</h3>
              <div class="type-list">
                <span
                  v-for="{ type } in pokemon.types"
                  :key="type.name"
                  class="type-pill"
                  :style="{ '--type-color': typeColor(type.name) }"
                >
                  {{ typeStyles[type.name]?.emoji ?? '⭐' }} {{ type.name }}
                </span>
              </div>
            </section>
            <section class="weakness-section">
              <h3>Debilidades</h3>
              <div class="weakness-list">
                <span
                  v-for="weakness in weaknesses(pokemon)"
                  :key="weakness"
                  class="weakness-pill"
                  :style="{ '--type-color': typeColor(weakness) }"
                >
                  {{ typeStyles[weakness]?.emoji ?? '⭐' }} {{ weakness }}
                </span>
                <span v-if="weaknesses(pokemon).length === 0" class="no-weakness">
                  Sin debilidades dobles
                </span>
              </div>
            </section>
          </div>

          <section class="stats-section" :aria-label="`Estadísticas de ${pokemon.name}`">
            <h3>Estadísticas</h3>
            <div v-for="stat in pokemon.stats" :key="stat.stat.name" class="stat">
              <div class="stat-label">
                <span>{{ statLabels[stat.stat.name] ?? stat.stat.name }}</span>
                <strong>{{ stat.base_stat }}<span class="stat-max"> / 255</span></strong>
              </div>
              <div class="stat-track">
                <span :style="{ width: `${Math.min(stat.base_stat / 255 * 100, 100)}%` }"></span>
              </div>
            </div>
          </section>
      </article>
      <div v-else class="empty-state">
        <span aria-hidden="true">🧭</span>
        <p>No hay un Pokémon para mostrar.</p>
      </div>
    </section>
  </main>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; }
body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: #f7f7f5;
  color: #242a33;
  font-family: 'DM Sans', sans-serif;
}
button, input, select { font: inherit; }
button:focus-visible, input:focus-visible, select:focus-visible {
  outline: 3px solid #edaa75;
  outline-offset: 2px;
}

.pokedex { width: min(1320px, 100%); min-height: 100vh; margin: auto; padding: 0 34px; }
.page-header { height: 72px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e8e7e4; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.brand-mark { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 50%; background: #ed8637; color: white; font-size: 18px; }
.brand-light, .header-note { color: #92918e; font-weight: 500; }
.header-note { font-size: 12px; }
.intro { padding: 34px 0 24px; text-align: center; }
.eyebrow { margin: 0 0 4px; color: #a09d98; font-size: 10px; font-weight: 700; letter-spacing: .2em; }
.intro h1 { margin: 0; font: 700 clamp(32px, 5vw, 46px)/1.2 'Space Grotesk', sans-serif; letter-spacing: -.05em; }
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.search-box, .filter-box { display: flex; height: 40px; align-items: center; border: 1px solid #e5e3df; border-radius: 8px; background: white; color: #82817d; }
.search-box { flex: 1; gap: 8px; padding: 0 12px; font-size: 20px; }
.search-box input { width: 100%; border: 0; outline: 0; background: transparent; font-size: 12px; }
.search-box input::placeholder { color: #a4a19d; }
.filter-box select { height: 100%; min-width: 150px; padding: 0 28px 0 11px; border: 0; outline: 0; background: transparent; color: #5c5b57; font-size: 11px; text-transform: capitalize; }
.results-count { color: #42413e; font-size: 12px; font-weight: 700; white-space: nowrap; }
.results-count span { color: #92908b; font-weight: 500; }
.card-grid { display: grid; gap: 16px; }
.pokemon-card { display: grid; grid-template-columns: minmax(210px, .85fr) minmax(190px, .8fr) minmax(320px, 1.5fr); min-height: 300px; align-items: center; gap: clamp(18px, 3vw, 42px); padding: 12px; border: 1px solid #e9e7e3; border-radius: 15px; background: #fff; box-shadow: 0 4px 16px #3333330a; }
.art-panel { display: flex; min-height: 274px; flex-direction: column; justify-content: space-between; overflow: hidden; padding: 13px 15px 12px; border-radius: 11px; background: linear-gradient(145deg, #f8c46d, #ef8637); color: #fff; }
.art-heading { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 700; letter-spacing: .08em; }
.pokemon-emoji { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 50%; background: #ffffff4d; font-size: 17px; }
.art-panel > img { width: 100%; height: 190px; object-fit: contain; filter: drop-shadow(0 8px 7px #54351b30); }
.physical { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; font-style: italic; }
.identity { min-width: 0; text-align: center; }
.large-number { display: block; color: #e9853a; font: italic 700 clamp(34px, 4vw, 56px)/1 'Space Grotesk', sans-serif; letter-spacing: .03em; }
.identity h2 { overflow: hidden; margin: 8px 0 21px; color: #292a2b; font: 700 21px 'Space Grotesk', sans-serif; text-overflow: ellipsis; text-transform: capitalize; white-space: nowrap; }
.identity section { margin-top: 16px; }
.identity h3, .stats-section > h3 { margin: 0 0 10px; color: #343536; font: 700 17px 'Space Grotesk', sans-serif; }
.type-list, .weakness-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 7px; }
.type-pill, .weakness-pill { display: inline-flex; align-items: center; gap: 5px; padding: 7px 11px; border-radius: 5px; background: color-mix(in srgb, var(--type-color) 85%, white); color: white; font-size: 10px; font-weight: 700; text-transform: capitalize; box-shadow: 0 2px 5px #00000012; }
.weakness-section { margin-top: 22px !important; }
.weakness-pill { background: color-mix(in srgb, var(--type-color) 82%, white); }
.no-weakness { color: #85827e; font-size: 11px; }
.stats-section { min-width: 0; padding: 4px 10px 4px 0; }
.stats-section > h3 { margin-bottom: 14px; text-align: center; }
.stat { margin: 0 0 11px; }
.stat-label { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 5px; color: #454544; font-size: 10px; font-weight: 600; }
.stat-label strong { white-space: nowrap; }
.stat-max { color: #9a9995; font-weight: 400; }
.stat-track { height: 12px; overflow: hidden; border: 1px solid #aaa9a5; border-radius: 99px; background: white; }
.stat-track span { display: block; height: 100%; min-width: 3px; border-radius: inherit; background: linear-gradient(90deg, #f5aa54, #ed7831); }
.message { margin: 0 0 14px; color: #a64b37; font-size: 12px; text-align: center; }
.loading-state, .empty-state { display: grid; min-height: 180px; place-content: center; justify-items: center; gap: 12px; color: #7b8390; font-size: 13px; text-align: center; }
.empty-state > span { font-size: 30px; }
.loader { width: 30px; height: 30px; border: 3px solid #e6e8ed; border-top-color: #e9853a; border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.load-more { display: flex; justify-content: center; padding: 24px 0; }
.load-more button { min-height: 40px; padding: 0 18px; border: 1px solid #e2dfda; border-radius: 8px; background: white; color: #454d59; cursor: pointer; font-size: 11px; font-weight: 700; }
.load-more button:disabled { cursor: wait; opacity: .65; }
.random-button { display: block; min-height: 44px; margin: 20px auto 28px; padding: 0 22px; border: 0; border-radius: 8px; background: #ed8637; color: white; cursor: pointer; font-size: 12px; font-weight: 700; box-shadow: 0 4px 10px #ed863733; }
.random-button:hover:not(:disabled) { background: #d97125; }
.random-button:disabled { cursor: wait; opacity: .65; }
.page-footer { padding: 16px 0 24px; border-top: 1px solid #e8e7e4; color: #9298a2; font-size: 10px; text-align: center; }
.page-footer a { color: #636b78; font-weight: 700; text-decoration: none; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; clip-path: inset(50%); }

@media (max-width: 900px) {
  .pokedex { padding: 0 20px; }
  .pokemon-card { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; }
  .art-panel { min-height: 260px; }
  .art-panel > img { height: 175px; }
  .stats-section { grid-column: 1 / -1; padding: 4px 8px; }
}
@media (max-width: 600px) {
  .pokedex { padding: 0 12px; }
  .pokemon-card { grid-template-columns: minmax(0, 1fr); gap: 16px; padding: 10px; }
  .art-panel { min-height: clamp(230px, 68vw, 320px); }
  .art-panel > img { height: clamp(155px, 48vw, 230px); }
  .physical { font-size: 10px; }
  .identity { padding: 8px 4px; }
  .large-number { font-size: 39px; }
  .identity h2 { font-size: 18px; margin-bottom: 16px; }
  .identity h3, .stats-section > h3 { font-size: 15px; }
  .type-pill, .weakness-pill { padding: 6px 9px; font-size: 10px; }
  .stats-section { padding: 6px 4px; }
  .stat { margin-bottom: 10px; }
  .stat-label { font-size: 11px; }
  .stat-track { height: 11px; }
}
@media (max-width: 360px) {
  .pokedex { padding: 0 8px; }
  .pokemon-card { padding: 8px; }
  .art-panel { padding: 11px; }
  .physical { font-size: 9px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
</style>
