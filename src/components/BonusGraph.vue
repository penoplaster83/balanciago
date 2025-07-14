<script setup lang="ts">
import { onMounted, computed, markRaw } from 'vue'
import { VueFlow, useVueFlow, ConnectionMode } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useBonusesStore } from '@/stores/bonuses'
import type { Edge, Node } from '@vue-flow/core'
import type { Bonus_Node } from '@/types/Bonus'
import BonusNode from './BonusNode.vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const bonusesStore = useBonusesStore()

const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges, nodeTypes } =
  useVueFlow({
    id: 'bonus-graph',
    defaultEdgeOptions: {
      type: 'smoothstep',
      style: {
        strokeWidth: 2,
      },
    },
    connectionMode: ConnectionMode.Loose,
  })

// Регистрируем пользовательский тип ноды
if (nodeTypes) {
  nodeTypes.value = {
    'bonus-node': markRaw(BonusNode) as any,
  }
}

// Преобразование бонусов в ноды для Vue Flow
const createNodesFromBonuses = (bonuses: Bonus_Node[]): Node[] => {
  return bonuses.map((bonus) => ({
    id: bonus.id,
    position: { x: bonus.x, y: bonus.y },
    data: {
      label: bonus.name,
      description: bonus.description,
    },
    draggable: true,
    type: 'bonus-node',
  }))
}

// Создание связей между нодами
const createEdgesFromBonuses = (bonuses: Bonus_Node[]): Edge[] => {
  const allEdges: Edge[] = []

  bonuses.forEach((bonus) => {
    if (bonus.dependencies.length > 0) {
      bonus.dependencies.forEach((dependencyId) => {
        allEdges.push({
          id: `${dependencyId}-to-${bonus.id}`,
          source: dependencyId,
          target: bonus.id,
          animated: false,
          style: { stroke: '#374151' },
          type: 'smoothstep',
        })
      })
    }
  })

  return allEdges
}

// Инициализация графа
onMounted(() => {
  const bonuses = bonusesStore.bonuses
  setNodes(createNodesFromBonuses(bonuses))
  setEdges(createEdgesFromBonuses(bonuses))
})

// Обработчик изменения позиции нод
const handleNodeChange = (changes: any) => {
  onNodesChange(changes)

  // Обновляем координаты в хранилище при окончании перетаскивания
  changes.forEach((change: any) => {
    if (change.type === 'position' && change.dragging === false) {
      const node = nodes.value.find((n) => n.id === change.id)
      if (node) {
        bonusesStore.updateBonusPosition(node.id, node.position.x, node.position.y)
      }
    }
  })
}

// Обработчик соединения
const handleConnect = (connection: any) => {
  onConnect(connection)
}

// Обработчик изменения связей
const handleEdgesChange = (changes: any) => {
  onEdgesChange(changes)
}
</script>

<template>
  <div class="bonus-graph">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      @nodesChange="handleNodeChange"
      @connect="handleConnect"
      @edgesChange="handleEdgesChange"
      class="vue-flow-wrapper"
    >
      <Background pattern="dots" :gap="20" :size="1" />
      <Controls position="bottom-right" />
      <MiniMap />
    </VueFlow>
  </div>
</template>

<style>
.bonus-graph {
  width: 100%;
  height: 100vh;
}

.vue-flow-wrapper {
  width: 100%;
  height: 100%;
}
</style>
