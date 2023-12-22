import type { Meta, StoryObj } from '@storybook/angular';
import { MummyComponent } from './mummy.component';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<MummyComponent> = {
  title: 'Example/MummyComponent',
  component: MummyComponent,
  tags: ['autodocs'],
  render: (args: MummyComponent) => ({
    props: {
      backgroundColor: null,
      ...args,
    },
  }),
  argTypes: {
    backgroundColor: {
      control: 'color',
    },
  },
};

export default meta;
type Story = StoryObj<MummyComponent>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    primary: true,
    label: 'MummyComponent',
  },
};

export const Secondary: Story = {
  args: {
    label: 'MummyComponent234',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: 'MummyComponent',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: 'MummyComponent',
  },
};
