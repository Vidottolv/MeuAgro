<script setup>
defineProps({ layer: { type: String, default: 'ndvi' } });
</script>
<template>
  <aside class="satellite-guide" aria-label="Guia de leitura das imagens">
    <p>
      <strong>Use o satélite para planejar a próxima visita.</strong> Compare regiões do talhão e
      datas para escolher onde observar a lavoura mais de perto.
    </p>
    <details>
      <summary>Como interpretar e usar estas imagens</summary>
      <p>
        <strong>Guia da camada: {{ layer === 'rgb' ? 'Cores naturais (RGB)' : 'NDVI' }}.</strong>
      </p>
      <h4>O que cada camada mostra</h4>
      <p>
        <strong>NDVI:</strong> combina luz vermelha e infravermelha para representar a presença de
        vegetação verde. Em geral, valores maiores estão associados a maior cobertura de vegetação
        verde. Não é uma fotografia nem uma nota de saúde da lavoura.
      </p>
      <p>
        <strong>Cores naturais:</strong> mostra a área com aparência próxima à de uma fotografia.
        Ajuda a reconhecer solo exposto, vegetação e nuvens e a contextualizar o NDVI.
      </p>
      <template v-if="layer !== 'rgb'">
        <h4>Como ler a escala do MeuAgro</h4>
        <ul class="color-guide">
          <li>
            <span class="swatch blue" aria-hidden="true" /><span
              ><strong>Azul (−1):</strong> extremo negativo da escala; valores negativos podem estar
              associados à água e outras superfícies sem vegetação.</span
            >
          </li>
          <li>
            <span class="swatch brown" aria-hidden="true" /><span
              ><strong>Marrom (0):</strong> próximo de zero, geralmente com pouca contribuição de
              vegetação verde.</span
            >
          </li>
          <li>
            <span class="swatch yellow" aria-hidden="true" /><span
              ><strong>Amarelo (0,2):</strong> valor positivo mais baixo, que pode ocorrer com
              vegetação esparsa ou mistura de solo e plantas.</span
            >
          </li>
          <li>
            <span class="swatch green" aria-hidden="true" /><span
              ><strong>Verde claro (0,5):</strong> maior sinal de vegetação verde em relação aos
              valores anteriores.</span
            >
          </li>
          <li>
            <span class="swatch dark-green" aria-hidden="true" /><span
              ><strong>Verde escuro (em direção a 1):</strong> valores elevados, frequentemente
              associados a vegetação mais densa.</span
            >
          </li>
        </ul>
        <p>
          Esses números são referências da nossa legenda, não limites universais de produtividade ou
          saúde. Cultura, fase de desenvolvimento, solo e cobertura da área mudam a interpretação. A
          imagem atual não calcula média do talhão nem mostra o valor exato de cada ponto.
        </p>
      </template>
      <template v-else>
        <h4>Como interpretar o RGB</h4>
        <p>
          RGB combina as bandas vermelha, verde e azul do Sentinel-2. As cores se aproximam da visão
          humana; o brilho é ajustado para facilitar a visualização. Não existe uma escala numérica
          de vigor como no NDVI.
        </p>
        <ul>
          <li>
            <strong>Tons verdes:</strong> podem indicar cobertura vegetal. Verde mais escuro,
            sozinho, não comprova melhor saúde ou maior produtividade.
          </li>
          <li>
            <strong>Tons marrons ou avermelhados:</strong> podem corresponder a solo exposto,
            palhada ou características do terreno. Considere o manejo e a fase da cultura.
          </li>
          <li>
            <strong>Regiões escuras:</strong> podem estar associadas à água, sombra ou diferenças de
            cobertura. A cor sozinha não identifica a causa.
          </li>
          <li>
            <strong>Regiões claras:</strong> podem refletir diferenças de solo, cobertura e
            iluminação. Nesta prévia, pixels classificados como nuvem ou sombra são descartados e
            podem aparecer transparentes.
          </li>
        </ul>
        <h4>Para que serve na visita técnica?</h4>
        <ol>
          <li>
            <strong>Reconheça o talhão:</strong> confira o contorno no mapa e observe diferenças
            visíveis de cobertura e solo exposto.
          </li>
          <li>
            <strong>Contextualize o NDVI:</strong> compare RGB e NDVI da mesma aquisição e do mesmo
            contorno. Uma região de NDVI baixo pode coincidir com solo exposto no RGB, sem que isso
            identifique o motivo.
          </li>
          <li>
            <strong>Compare datas:</strong> acompanhe mudanças visíveis antes e depois de plantio,
            colheita ou manejo. Considere também mudanças na iluminação e na qualidade da cena.
          </li>
          <li>
            <strong>Verifique no campo:</strong> escolha os pontos de observação e registre fotos,
            sintomas e histórico na visita técnica.
          </li>
        </ol>
        <p>
          <strong>Exemplo:</strong> uma mancha marrom onde você esperava cobertura verde merece uma
          observação no local. Ela pode refletir solo exposto, estágio da cultura ou manejo; a
          imagem não confirma falha de plantio ou doença.
        </p>
        <p>
          O RGB não mede diretamente fertilidade, umidade do solo, produtividade ou presença de
          pragas. Ele fornece contexto visual para comparar com o NDVI e com as observações do
          campo.
        </p>
      </template>
      <h4>O que significa o quadriculado?</h4>
      <p>
        É transparência: pode ser a região fora do contorno ou pixels sem dados aproveitáveis,
        descartados por nuvens, sombra ou qualidade. Não comprova ausência de vegetação e, no NDVI,
        não representa valor zero. Confira o recorte sobre o mapa, especialmente se aparecer apenas
        uma faixa estreita.
      </p>
      <template v-if="layer !== 'rgb'">
        <h4>Como levar isso para o campo</h4>
        <ol>
          <li>
            <strong>Localize diferenças:</strong> observe regiões com cores distintas e identifique
            sua posição no mapa do talhão.
          </li>
          <li>
            <strong>Compare datas:</strong> abra imagens existentes do mesmo contorno e considere a
            fase da cultura e as condições de cada aquisição. Uma queda de NDVI pode também
            acompanhar maturação ou colheita.
          </li>
          <li>
            <strong>Confira no local:</strong> use as regiões como pontos de observação. Na visita
            técnica, registre sintomas, fotos e histórico antes de concluir a causa.
          </li>
        </ol>
        <p>
          <strong>Exemplo:</strong> se uma região fica menos verde que o restante em várias datas,
          priorize uma observação no local. A cor não distingue sozinha falta de água, praga,
          doença, falha de plantio ou diferenças de solo.
        </p>
      </template>
      <h4>Data, nuvens e nível de detalhe</h4>
      <p>
        A imagem representa a data da aquisição, não a situação em tempo real. A porcentagem de
        nuvens corresponde à cena inteira do satélite, não ao seu talhão. Mesmo uma cena com poucas
        nuvens pode ter pixels descartados justamente na sua área.
      </p>
      <p>
        Uma resolução aproximada de 10 m representa cerca de 10 × 10 m de terreno por pixel. A
        prévia pode usar resolução mais baixa em áreas maiores; ampliar a tela não revela plantas
        individuais. A imagem orienta a observação e não determina sozinho uma aplicação ou dose.
      </p>
      <h4>Como evitar consumo desnecessário</h4>
      <p>
        Busque as cenas disponíveis antes de processar. Reutilize o mesmo intervalo durante a
        validade do cache e abra as imagens já salvas no histórico. Ler este guia não faz consultas
        ao satélite.
      </p>
    </details>
  </aside>
</template>

<style scoped>
.satellite-guide {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--border, #d7dfd4);
  border-radius: 1rem;
}
summary {
  cursor: pointer;
  font-weight: 700;
}
summary:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
h4 {
  margin: 1.25rem 0 0.5rem;
}
p,
li {
  line-height: 1.6;
}
ol {
  padding-left: 1.4rem;
}
li + li {
  margin-top: 0.75rem;
}
.color-guide {
  list-style: none;
  padding: 0;
}
.color-guide li {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.swatch {
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 1.1rem;
  border-radius: 0.25rem;
  margin-top: 0.25rem;
  border: 1px solid #777;
}
.blue {
  background: #1e50a0;
}
.brown {
  background: #a05a28;
}
.yellow {
  background: #e0bf46;
}
.green {
  background: #71ab3a;
}
.dark-green {
  background: #005a26;
}
</style>
