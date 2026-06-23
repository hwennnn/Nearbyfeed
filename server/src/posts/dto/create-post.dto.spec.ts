import { CreatePostBodyPipe } from '../pipes/create-post-body.pipe';

const transformBody = async (body: Record<string, unknown>) =>
  await new CreatePostBodyPipe().transform(body);

describe('CreatePostDto', () => {
  it('normalizes multipart bracket fields for poll and location data', async () => {
    const dto = await transformBody({
      title: 'Library steps are buzzing',
      content: 'Tiny projector night is drawing a crowd by the steps.',
      latitude: '37.323',
      longitude: '-122.0322',
      'poll[votingLength]': '1',
      'poll[options][]': ['pull up', 'too packed'],
      'location[name]': 'Library steps',
      'location[formattedAddress]': 'Cupertino Library, CA',
      'location[latitude]': '37.323',
      'location[longitude]': '-122.0322',
    });

    expect(dto.poll).toEqual({
      votingLength: 1,
      options: ['pull up', 'too packed'],
    });
    expect(dto.location).toEqual({
      name: 'Library steps',
      formattedAddress: 'Cupertino Library, CA',
      latitude: 37.323,
      longitude: -122.0322,
    });
  });

  it('omits blank optional content so title-only posts match shared validation', async () => {
    const dto = await transformBody({
      title: 'Library steps are buzzing',
      content: '   ',
      latitude: '37.323',
      longitude: '-122.0322',
    });

    expect(dto.content).toBeUndefined();
  });
});
