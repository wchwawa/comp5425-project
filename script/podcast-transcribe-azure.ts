import { sl } from "element-plus/es/locale";

interface TranscriptionProperties {
  wordLevelTimestampsEnabled?: boolean;
  displayFormWordLevelTimestampsEnabled?: boolean; // For Whisper models
  diarizationEnabled?: boolean;
  punctuationMode?: 'None' | 'Dictated' | 'Automatic' | 'DictatedAndAutomatic';
  profanityFilterMode?: 'None' | 'Removed' | 'Tags' | 'Masked';
  languageIdentification?: {
    candidateLocales: string[];
  };
  timeToLive?: string; // e.g., "PT1H" for 1 hour
}

interface TranscriptionRequest {
  contentUrls?: string[];
  contentContainerUrl?: string;
  locale: string;
  displayName: string;
  model?: string; // Model ID
  properties?: TranscriptionProperties;
}

interface TranscriptionModelInfo {
  self: string;
}

interface TranscriptionLinks {
  files: string;
}

interface TranscriptionResponse {
  self: string;
  model: TranscriptionModelInfo;
  links: TranscriptionLinks;
  properties?: {
    diarizationEnabled?: boolean;
    wordLevelTimestampsEnabled?: boolean;
    displayFormWordLevelTimestampsEnabled?: boolean;
    channels?: number[];
    punctuationMode?: string;
    profanityFilterMode?: string;
    languageIdentification?: {
      candidateLocales: string[];
    };
  };
  lastActionDateTime: string;
  status: 'NotStarted' | 'Running' | 'Succeeded' | 'Failed';
  createdDateTime: string;
  locale: string;
  displayName: string;
}

interface TranscriptionFileLink {
  contentUrl: string;
}

interface TranscriptionFile {
  self: string;
  name: string;
  kind: 'Transcription' | 'TranscriptionReport';
  properties: {
    size: number;
  };
  createdDateTime: string;
  links: TranscriptionFileLink;
}

interface TranscriptionFilesListResponse {
  values: TranscriptionFile[];
}

interface SelfAndContentUrl {
  selfUrl: string;
  contentUrl: string;
}

/**
 * Creates a batch transcription job with Azure Speech to Text API.
 * @param subscriptionKey Your Speech resource key.
 * @param serviceRegion Your Speech resource region.
 * @param requestBody The body of the transcription request.
 * @returns A promise that resolves to the transcription job details.
 */
async function createTranscriptionJob(
  subscriptionKey: string,
  serviceRegion: string,
  requestBody: TranscriptionRequest
): Promise<TranscriptionResponse> {
  const url = `https://${serviceRegion}.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions`;

  if (!requestBody.contentUrls && !requestBody.contentContainerUrl) {
    throw new Error(
      'Either contentUrls or contentContainerUrl must be provided.'
    );
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create transcription job: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const responseData: TranscriptionResponse = await response.json();
  return responseData;
}

/**
 * Gets the status of a transcription job.
 * @param subscriptionKey Your Speech resource key.
 * @param serviceRegion Your Speech resource region.
 * @param transcriptionId The ID of the transcription job.
 * @returns A promise that resolves to the transcription job status.
 */
async function getTranscriptionStatus(
  subscriptionKey: string,
  serviceRegion: string,
  transcriptionId: string
): Promise<TranscriptionResponse> {
  const url = `https://${serviceRegion}.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions/${transcriptionId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to get transcription status: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const responseData: TranscriptionResponse = await response.json();
  return responseData;
}

/**
 * Lists the files associated with a completed transcription job.
 * @param subscriptionKey Your Speech resource key.
 * @param filesUrl The URL for the files endpoint of the transcription job (from jobDetails.links.files).
 * @returns A promise that resolves to the list of transcription files.
 */
async function getTranscriptionFiles(
  subscriptionKey: string,
  filesUrl: string
): Promise<SelfAndContentUrl[]> {
  const response = await fetch(filesUrl, {
    method: 'GET',
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to get transcription files: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const responseData: TranscriptionFilesListResponse = await response.json();

  const selfAndContentUrls = responseData.values.map(file => ({
    selfUrl: file.self,
    contentUrl: file.links.contentUrl
  }));

  return selfAndContentUrls;
}

/**
 * Transcribes audio from a list of content URLs using Azure Speech to Text.
 *
 * @param contentUrls An array of URLs pointing to the audio files to be transcribed.
 * @param locale The locale of the audio data (e.g., "en-US"). Defaults to "en-US".
 * @param displayName A human-readable name for the transcription job. Defaults to "Batch Transcription via SDK".
 * @param properties Optional properties to configure the transcription, such as diarization or punctuation.
 * @returns A promise that resolves to an array of objects containing the self URL and content URL for each transcription file.
 * @throws Error if environment variables are not set or if any API call fails.
 */
export async function transcribeAudioFromUrls(
  contentUrls: string[],
  locale: string = 'en-US',
  displayName: string = 'Batch Transcription via SDK',
  properties?: TranscriptionProperties
): Promise<SelfAndContentUrl[]> {
  const subscriptionKey = process.env.AZURE_SPEECH_API_KEY;
  const serviceRegion = process.env.AZURE_SPEECH_REGION;

  if (!subscriptionKey) {
    throw new Error('AZURE_SPEECH_API_KEY environment variable is not set.');
  }
  if (!serviceRegion) {
    throw new Error('AZURE_SPEECH_REGION environment variable is not set.');
  }

  if (!contentUrls || contentUrls.length === 0) {
    throw new Error('At least one content URL must be provided.');
  }

  const requestBody: TranscriptionRequest = {
    contentUrls,
    locale,
    displayName,
    properties: properties || {
      wordLevelTimestampsEnabled: true,
      punctuationMode: 'Automatic',
      // Optional: Add diarization if needed, but it requires audio to be mono and 16kHz
      // diarizationEnabled: true,
    },
  };

  console.log('Creating transcription job with request:', JSON.stringify(requestBody, null, 2));
  const jobDetails = await createTranscriptionJob(
    subscriptionKey,
    serviceRegion,
    requestBody
  );
  console.log('Transcription job created:', jobDetails.self);

  let statusResponse = jobDetails;
  const pollingIntervalMs = 60000; // Poll every 1 minute
  // Max 5 minutes per audio file. Since polling interval is 1 minute, maxAttempts is number of files * 5.
  const maxAttempts = contentUrls.length * 5;
  let attempts = 0;

  while (
    statusResponse.status !== 'Succeeded' &&
    statusResponse.status !== 'Failed' &&
    attempts < maxAttempts
  ) {
    await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
    console.log(
      `Polling for status (attempt ${attempts + 1}/${maxAttempts}): ${
        statusResponse.self
      }`
    );
    statusResponse = await getTranscriptionStatus(
      subscriptionKey,
      serviceRegion,
      statusResponse.self.split('/').pop()! // Extract job ID from self URL
    );
    console.log('Current job status:', statusResponse.status);
    attempts++;
  }

  if (statusResponse.status === 'Failed') {
    throw new Error(
      `Transcription failed. Status: ${statusResponse.status}. Last update: ${statusResponse.lastActionDateTime}`
    );
  }

  if (statusResponse.status !== 'Succeeded') {
    throw new Error(
      `Transcription did not succeed within the timeout period. Final status: ${statusResponse.status}`
    );
  }

  console.log('Transcription succeeded. Fetching files...');
  if (!statusResponse.links?.files) {
    throw new Error(
      'Transcription job succeeded but files link is missing in the response.'
    );
  }

  const files = await getTranscriptionFiles(
    subscriptionKey,
    statusResponse.links.files
  );
  console.log('Transcription files retrieved:', files);
  return files;
}

async function main() {
  console.log('Starting transcription test in main function...');

  // IMPORTANT: Replace these with actual publicly accessible URLs to your audio files.
  const exampleAudioUrls = [
    'https://traffic.megaphone.fm/PPS8874745706.mp3?updated=1738879542', // Replace with your actual audio file URL
    // 'https://pdst.fm/e/mgln.ai/e/309/traffic.megaphone.fm/TCP4937888369.mp3?updated=1744980808',
    // 'https://www.podtrac.com/pts/redirect.mp3/pdst.fm/e/traffic.megaphone.fm/PPLLC2707506448.mp3?updated=1746591002'
  ];
  try {
    console.log(`Attempting to transcribe ${exampleAudioUrls.length} audio file(s):`);
    exampleAudioUrls.forEach((url, index) => console.log(`  ${index + 1}: ${url}` ));

    // Optional: Define custom properties if needed
    // const customProperties: TranscriptionProperties = {
    //   wordLevelTimestampsEnabled: true,
    //   punctuationMode: 'DictatedAndAutomatic',
    //   diarizationEnabled: false, // Set to true if your audio is suitable and you need speaker separation
    // };

    const transcriptionFiles = await transcribeAudioFromUrls(
      exampleAudioUrls,
      'en-US', // Specify the locale of your audio
      'Test Transcription from Main'
      // customProperties // Uncomment to use custom properties
    );

    console.log('\n--- Transcription Successful ---');
    if (transcriptionFiles.length > 0) {
      console.log('Retrieved transcription file URLs:');
      transcriptionFiles.forEach((file, index) => {
        console.log(`  File ${index + 1}:`);
        console.log(`    Self URL: ${file.selfUrl}`);
        console.log(`    Content URL (for download): ${file.contentUrl}`);
      });
      console.log('\nYou can now download the transcription results from the content URLs.');
    } else {
      console.log('No transcription files were returned, though the job succeeded.');
    }
  } catch (error) {
    console.error('\n--- Transcription Process Failed ---');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.stack) {
        // console.error('Stack trace:', error.stack);
      }
    } else {
      console.error('An unknown error occurred:', error);
    }
    console.error('Please check your Azure Speech service credentials, region, and input audio URLs.');
  }

  console.log('\nMain function execution finished.');
}

main().catch(error => {
  // This catch is mostly for unhandled promise rejections from main itself,
  // though the try/catch inside main should handle most operational errors.
  console.error("Unhandled error in main execution:", error);
});