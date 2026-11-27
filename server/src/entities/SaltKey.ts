import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'salt_key' })
@Check('id = 1')
export class SaltKey {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id!: number;

  @Column({ type: 'text' })
  salt!: string;

  // 'YYYY-MM-DD' (día en el que se generó el salt)
  @Column({ name: 'salt_date', type: 'date' })
  saltDate!: string;
}
