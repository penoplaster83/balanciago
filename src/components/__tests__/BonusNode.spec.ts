import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BonusNode from '../BonusNode.vue'

describe('BonusNode', () => {
  it('renders label and description', () => {
    const wrapper = mount(BonusNode, {
      props: {
        data: { label: 'Power Strike', description: 'Deals extra damage.' },
        dragging: false,
      },
    })

    expect(wrapper.text()).toContain('Power Strike')
    expect(wrapper.text()).toContain('Deals extra damage.')
  })

  it('applies dragging class when dragging', () => {
    const wrapper = mount(BonusNode, {
      props: {
        data: { label: 'Arcane Shield', description: 'Absorbs damage.' },
        dragging: true,
      },
    })

    expect(wrapper.classes()).toContain('dragging')
  })
})
