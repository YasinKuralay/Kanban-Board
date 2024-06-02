import type { Meta, StoryObj } from '@storybook/angular';

import { HeaderComponent } from './header.component';

const meta: Meta<HeaderComponent> = {
  title: 'UI/Header',
  component: HeaderComponent,
};

export default meta;
type Story = StoryObj<HeaderComponent>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
  render: () => ({
    // props: {
    // },
  }),
};
