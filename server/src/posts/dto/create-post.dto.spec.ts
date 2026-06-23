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

  it('trims create-post text fields before validation and persistence', async () => {
    const dto = await transformBody({
      title: '  Library steps are buzzing  ',
      content: '  Tiny projector night is drawing a crowd by the steps.  ',
      latitude: '37.323',
      longitude: '-122.0322',
      'poll[votingLength]': '1',
      'poll[options][]': [' pull up ', ' too packed '],
      'location[name]': ' Library steps ',
      'location[formattedAddress]': ' Cupertino Library, CA ',
      'location[latitude]': '37.323',
      'location[longitude]': '-122.0322',
    });

    expect(dto.title).toBe('Library steps are buzzing');
    expect(dto.content).toBe('Tiny projector night is drawing a crowd by the steps.');
    expect(dto.poll?.options).toEqual(['pull up', 'too packed']);
    expect(dto.location?.name).toBe('Library steps');
    expect(dto.location?.formattedAddress).toBe('Cupertino Library, CA');
  });

  it('rejects whitespace-only titles after trimming', async () => {
    await expect(
      transformBody({
        title: '    ',
        latitude: '37.323',
        longitude: '-122.0322',
      }),
    ).rejects.toThrow();
  });

  it('rejects poll options that are blank after trimming', async () => {
    await expect(
      transformBody({
        title: 'Library steps are buzzing',
        latitude: '37.323',
        longitude: '-122.0322',
        'poll[votingLength]': '1',
        'poll[options][]': ['pull up', '   '],
      }),
    ).rejects.toThrow();
  });
});
