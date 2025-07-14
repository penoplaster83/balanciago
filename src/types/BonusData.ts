export interface BonusDataTest {
  [key: string]: {
    Name: string
    Description: number
    param3?: boolean
    param4: string[]
    param5?: {
      id: number
      name: string
      active?: boolean
    }
    param6?: string
  }[]
}
