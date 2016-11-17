"use strict";

const handler = require('../../../handler/ECR/RepositoryMetrics');

describe('ECR/RepositoryMetrics handler', () => {
  const noop = () => {
  };
  let ecrSdk;

  function image(imageDigest, imageSizeInBytes, imagePushedAt) {
    return {
      imageDigest: imageDigest,
      imageSizeInBytes: imageSizeInBytes,
      imagePushedAt: imagePushedAt
    };
  }

  describe('information retrieval from ECS', () => {
    describe('for service description', () => {
      function mockEcrSdk(listImagesResponses,
                          describeImagesResponse) {
        let listImagesCall     = 0;
        let describeImagesCall = 0;

        spyOn(ecrSdk, 'listImages').and.callFake((params, cb) => {
          cb(null, listImagesResponses[listImagesCall++]);
        });
        spyOn(ecrSdk, 'describeImages').and.callFake((params, cb) => {
          cb(null, describeImagesResponse[describeImagesCall++]);
        });
      }

      beforeEach(() => {
        ecrSdk = {
          listImages: noop,
          describeImages: noop
        };
      });

      it('retrieves description of images from repo with few images',
        (done) => {
          const image1 = image('digest1');
          const image2 = image('digest2');

          mockEcrSdk(
            [{
              imageIds: [image1, image2],
              nextToken: null
            }],
            [{
              imageDetails: [image1, image2]
            }]
          );

          handler.getRepositoryImages(ecrSdk, 'some-repo', (err, data) => {
            if (err) {
              return done.fail();
            }

            expect(ecrSdk.listImages)
              .toHaveBeenCalledWith(jasmine.objectContaining({
                repositoryName: 'some-repo'
              }), jasmine.any(Function));

            expect(ecrSdk.describeImages)
              .toHaveBeenCalledWith(jasmine.objectContaining({
                repositoryName: 'some-repo',
                imageIds: [image1, image2]
              }), jasmine.any(Function));

            expect(data).toEqual([
              jasmine.objectContaining(image1),
              jasmine.objectContaining(image2)
            ]);
            done();
          });
        });

      it('retrieves description of cluster with more services', (done) => {
        const image1 = image('digest1');
        const image2 = image('digest2');

        mockEcrSdk(
          [
            {imageIds: [image1], nextToken: 1},
            {imageIds: [image2], nextToken: null}],
          [
            {imageDetails: [image1]},
            {imageDetails: [image2]}
          ]
        );

        handler.getRepositoryImages(ecrSdk, 'some-big-repo', (err, data) => {
          if (err) {
            return done.fail();
          }

          expect(ecrSdk.listImages)
            .toHaveBeenCalledWith(jasmine.objectContaining({
              repositoryName: 'some-big-repo'
            }), jasmine.any(Function));
          expect(ecrSdk.listImages).toHaveBeenCalledTimes(2);

          expect(ecrSdk.describeImages).toHaveBeenCalledWith({
            repositoryName: 'some-big-repo',
            imageIds: [image1]
          }, jasmine.any(Function));

          expect(ecrSdk.describeImages).toHaveBeenCalledWith({
            repositoryName: 'some-big-repo',
            imageIds: [image2]
          }, jasmine.any(Function));

          expect(data).toEqual([
            jasmine.objectContaining(image1),
            jasmine.objectContaining(image2)
          ]);
          done();
        });
      });
    });
  });

  describe('metrics extraction', () => {
    it('generate Images by counting them', () => {
      handler.extractMetrics([image(), image(), image()], (err, metrics) => {
        expect(metrics.MetricData).toEqual(jasmine.arrayContaining([{
          MetricName: 'Images',
          Value: 3,
          Unit: 'Count'
        }]));
      });
    });

    it('generate ImagesSize with statistics', () => {
      const image1 = image('1', 1);
      const image2 = image('2', 2);
      const image3 = image('3', 3);

      handler.extractMetrics([image1, image2, image3], (err, metrics) => {
        expect(metrics.MetricData).toEqual(jasmine.arrayContaining([{
          MetricName: 'ImagesSize',
          Value: 2,
          Unit: 'Bytes',
          StatisticValues: {
            SampleCount: 3,
            Maximum: 3,
            Minimum: 1,
            Sum: 6
          }
        }]));
      })
    });
  });
});
