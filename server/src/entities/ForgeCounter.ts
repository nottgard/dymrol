import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'forge_counter' })
@Check('id = 1')
export class ForgeCounter {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id!: number;

  @Column({ type: 'bigint', default: 0 })
  smashes!: string;
}
