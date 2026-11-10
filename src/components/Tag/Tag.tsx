import { Cluster } from '../Cluster';
import styles from './Tag.module.css';

interface TagProps {
  children: string;
}

export function Tag({ children }: TagProps) {
  return <span className={styles.tag}>{children}</span>;
}

interface TagListProps {
  tags: readonly string[];
  label: string;
}

export function TagList({ tags, label }: TagListProps) {
  return (
    <Cluster as="ul" gap={2} aria-label={label}>
      {tags.map((tag) => (
        <li key={tag}>
          <Tag>{tag}</Tag>
        </li>
      ))}
    </Cluster>
  );
}
