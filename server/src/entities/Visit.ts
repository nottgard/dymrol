import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'visits' })
@Index('visits_date_page_idx', ['visitDate', 'page'])
@Index('visits_date_visitor_idx', ['visitDate', 'visitorHash'])
export class Visit {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ name: 'visitor_hash', type: 'char', length: 64 })
  visitorHash!: string;

  // 'YYYY-MM-DD'
  @Column({ name: 'visit_date', type: 'date' })
  visitDate!: string;

  @Column({ type: 'varchar', length: 255 })
  page!: string;
}
