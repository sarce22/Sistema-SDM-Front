import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonTable, SkeletonList } from './SkeletonLoaders';

describe('Componentes SkeletonLoaders', () => {
    it('SkeletonTable debe renderizar la cantidad especificada de filas y columnas', () => {
        const { container } = render(<SkeletonTable columns={5} rows={6} />);

        const headerCells = container.querySelectorAll('thead th');
        expect(headerCells.length).toBe(5);

        const bodyRows = container.querySelectorAll('tbody tr');
        expect(bodyRows.length).toBe(6);

        const bodyCells = container.querySelectorAll('tbody td');
        expect(bodyCells.length).toBe(5 * 6);
    });

    it('SkeletonList debe renderizar la cantidad especificada de tarjetas esqueleto', () => {
        const { container } = render(<SkeletonList items={7} />);

        const cards = container.querySelectorAll('.card');
        expect(cards.length).toBe(7);
    });
});
