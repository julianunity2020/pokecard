const API_BASE = 'https://pokeapi.co/api/v2'

async function fetchPokemonApi(path) {
  const url = path.startsWith('http') ? path : `${API_BASE}/${path}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`PokeAPI respondió con estado ${response.status}`)
  }

  return response.json()
}

export function getPokemon(nameOrUrl) {
  return fetchPokemonApi(
    nameOrUrl.startsWith('http') ? nameOrUrl : `pokemon/${encodeURIComponent(nameOrUrl)}`,
  )
}

export function getPokemonList(limit = 24, offset = 0) {
  return fetchPokemonApi(`pokemon?limit=${limit}&offset=${offset}`)
}

export function getPokemonType(name) {
  return fetchPokemonApi(`type/${encodeURIComponent(name)}`)
 }