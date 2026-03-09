import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RewardsList } from '../rewards-list';
import type { Tables } from '@/lib/supabase/types';

function makeReward(overrides: Partial<Tables<'rewards'>> = {}): Tables<'rewards'> {
  return {
    id: 'r1',
    name: 'テスト報酬',
    description: 'テスト説明',
    type: 'badge',
    required_count: 5,
    badge_image_url: null,
    coupon_code: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Tables<'rewards'>;
}

describe('RewardsList', () => {
  it('shows empty message when no rewards', () => {
    render(
      <RewardsList
        rewards={[]}
        unlockedRewardIds={new Set()}
        stampCount={0}
        onSelectReward={vi.fn()}
      />
    );

    expect(screen.getByText('報酬はまだありません')).toBeInTheDocument();
  });

  it('renders reward items with name and description', () => {
    const rewards = [
      makeReward({ id: 'r1', name: '初心者バッジ', description: '3箇所訪問で獲得' }),
      makeReward({ id: 'r2', name: 'マスターバッジ', description: '全箇所制覇', required_count: 10 }),
    ];

    render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set()}
        stampCount={0}
        onSelectReward={vi.fn()}
      />
    );

    expect(screen.getByText('初心者バッジ')).toBeInTheDocument();
    expect(screen.getByText('3箇所訪問で獲得')).toBeInTheDocument();
    expect(screen.getByText('マスターバッジ')).toBeInTheDocument();
    expect(screen.getByText('全箇所制覇')).toBeInTheDocument();
  });

  it('shows "獲得済み" badge for unlocked rewards', () => {
    const rewards = [makeReward({ id: 'r1', name: '初心者バッジ' })];

    render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set(['r1'])}
        stampCount={5}
        onSelectReward={vi.fn()}
      />
    );

    expect(screen.getByText('獲得済み')).toBeInTheDocument();
  });

  it('shows stamp progress (capped at required_count)', () => {
    const rewards = [makeReward({ id: 'r1', required_count: 5 })];

    render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set()}
        stampCount={3}
        onSelectReward={vi.fn()}
      />
    );

    expect(screen.getByText('3 / 5 スタンプ')).toBeInTheDocument();
  });

  it('caps displayed stamps at required_count', () => {
    const rewards = [makeReward({ id: 'r1', required_count: 5 })];

    render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set()}
        stampCount={8}
        onSelectReward={vi.fn()}
      />
    );

    expect(screen.getByText('5 / 5 スタンプ')).toBeInTheDocument();
  });

  it('shows badge type label for badge rewards', () => {
    const rewards = [makeReward({ type: 'badge' })];

    render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set()}
        stampCount={0}
        onSelectReward={vi.fn()}
      />
    );

    expect(screen.getByText('バッジ')).toBeInTheDocument();
  });

  it('shows coupon type label for coupon rewards', () => {
    const rewards = [makeReward({ type: 'coupon' })];

    render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set()}
        stampCount={0}
        onSelectReward={vi.fn()}
      />
    );

    expect(screen.getByText('クーポン')).toBeInTheDocument();
  });

  it('calls onSelectReward when a reward is clicked', () => {
    const reward = makeReward({ id: 'r1', name: '初心者バッジ' });
    const onSelectReward = vi.fn();

    render(
      <RewardsList
        rewards={[reward]}
        unlockedRewardIds={new Set()}
        stampCount={0}
        onSelectReward={onSelectReward}
      />
    );

    fireEvent.click(screen.getByText('初心者バッジ'));
    expect(onSelectReward).toHaveBeenCalledWith(reward);
  });

  // --- QA追加テスト ---

  it('renders badge image when unlocked badge has badge_image_url', () => {
    const rewards = [makeReward({
      id: 'r1',
      name: 'ゴールドバッジ',
      type: 'badge',
      badge_image_url: 'https://example.com/badge.png',
      required_count: 3,
    })];

    render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set(['r1'])}
        stampCount={5}
        onSelectReward={vi.fn()}
      />
    );

    const img = screen.getByAltText('ゴールドバッジのバッジ');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/badge.png');
  });

  it('does not show description when description is null', () => {
    const rewards = [makeReward({ id: 'r1', name: 'テスト報酬', description: null })];

    const { container } = render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set()}
        stampCount={0}
        onSelectReward={vi.fn()}
      />
    );

    expect(screen.getByText('テスト報酬')).toBeInTheDocument();
    // description paragraph should not exist
    const typeLabel = screen.getByText('バッジ');
    const labelContainer = typeLabel.closest('.flex');
    const descriptionP = labelContainer?.querySelector('p');
    expect(descriptionP).toBeNull();
  });

  it('shows distinct styling for canUnlock state (not yet unlocked but enough stamps)', () => {
    const rewards = [makeReward({ id: 'r1', required_count: 3 })];

    const { container } = render(
      <RewardsList
        rewards={rewards}
        unlockedRewardIds={new Set()}
        stampCount={5}
        onSelectReward={vi.fn()}
      />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('border-primary');
    expect(button?.className).not.toContain('border-stamp-gold');
  });
});
