<script setup>
import { ref } from 'vue';

const encabezado = "Bienvenido este es el encabezado del sitio"

</script>

<template>
  <p class="encabezado">{{ encabezado }}</p>
</template>

<style lang="css">
.encabezado{
background-color: aquamarine;
color: black;
padding: 1rem;
}
  
</style>
